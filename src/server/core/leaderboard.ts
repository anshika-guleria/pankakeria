import { redis } from '@devvit/web/server';
import { z } from 'zod';

export const leaderboardAttemptSchema = z.object({
  moneyMade: z.number().int().min(0).max(1_000_000),
  elapsedSeconds: z.number().int().min(0).max(9_999),
  ordersServed: z.number().int().min(0).max(1_000_000),
  rating: z.number().min(0).max(5),
});

const leaderboardEntrySchema = leaderboardAttemptSchema.extend({
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  rankKey: z.number().int(),
  completedAt: z.number().int(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardAttempt = z.infer<typeof leaderboardAttemptSchema>;

export type LeaderboardSnapshot = {
  entries: LeaderboardEntry[];
  personalBest: LeaderboardEntry | null;
  username: string | null;
  saved: boolean;
};

const getBoardKey = (postId: string | undefined) =>
  `pankakeria:leaderboard:v2:${postId ?? 'global'}`;
const getGlobalBoardKey = () => getBoardKey(undefined);

const getMemberKey = (username: string) => username.toLowerCase();

const getLeaderboardRankKey = ({
  moneyMade,
  elapsedSeconds,
  ordersServed,
  rating,
}: LeaderboardAttempt) =>
  moneyMade * 100_000_000 +
  (9_999 - elapsedSeconds) * 10_000 +
  Math.round(rating * 10) * 100 +
  Math.min(ordersServed, 99);

const readEntry = (raw: string | undefined): LeaderboardEntry | null => {
  if (!raw) return null;

  try {
    const result = leaderboardEntrySchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const getLeaderboardSnapshot = async (
  postId: string | undefined,
  username: string | undefined,
  saved = false
): Promise<LeaderboardSnapshot> => {
  const boardKeys = [...new Set([getGlobalBoardKey(), getBoardKey(postId)])];
  const entriesByBoard = await Promise.all(
    boardKeys.map(async (boardKey) => {
      const leaders = await redis.zRange(boardKey, 0, -1, {
        by: 'rank',
        reverse: true,
      });
      const entriesKey = `${boardKey}:entries`;

      return (
        await Promise.all(
          leaders.map(async ({ member }) =>
            readEntry(await redis.hGet(entriesKey, member))
          )
        )
      ).filter((entry): entry is LeaderboardEntry => entry !== null);
    })
  );
  const bestByPlayer = new Map<string, LeaderboardEntry>();

  for (const entry of entriesByBoard.flat()) {
    const key = getMemberKey(entry.username);
    const current = bestByPlayer.get(key);
    if (!current || entry.rankKey > current.rankKey) {
      bestByPlayer.set(key, entry);
    }
  }

  const entries = [...bestByPlayer.values()]
    .sort((left, right) => right.rankKey - left.rankKey);
  const personalBestEntries = username
    ? await Promise.all(
        boardKeys.map(async (boardKey) =>
          readEntry(
            await redis.hGet(
              `${boardKey}:entries`,
              getMemberKey(username)
            )
          )
        )
      )
    : [];
  const personalBest = personalBestEntries
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort((left, right) => right.rankKey - left.rankKey)[0] ?? null;

  return { entries, personalBest, username: username ?? null, saved };
};

export const saveLeaderboardAttempt = async (
  postId: string | undefined,
  username: string,
  attempt: LeaderboardAttempt,
  avatarUrl: string | null
): Promise<LeaderboardSnapshot> => {
  const boardKey = getGlobalBoardKey();
  const entriesKey = `${boardKey}:entries`;
  const member = getMemberKey(username);
  const rankKey = getLeaderboardRankKey(attempt);
  const existingScore = await redis.zScore(boardKey, member);

  if (existingScore === undefined || rankKey > existingScore) {
    const entry: LeaderboardEntry = {
      ...attempt,
      username,
      avatarUrl,
      rankKey,
      completedAt: Date.now(),
    };

    await redis.hSet(entriesKey, { [member]: JSON.stringify(entry) });
    await redis.zAdd(boardKey, { member, score: rankKey });
  }

  return getLeaderboardSnapshot(postId, username, true);
};
