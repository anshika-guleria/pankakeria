import './index.css';

import { StrictMode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent } from 'react';
import {
  getRandomOrder,
  getToppingCombinationKey,
  ORDERS,
  TOPPING_COMBINATION_COUNT,
  TOPPING_ORDER,
  TOPPINGS,
} from './game-data';
import type { Order, Topping, ToppingCounts } from './game-data';
import type { LeaderboardSnapshot } from '../server/core/leaderboard';
import { trpc } from './trpc';
import {
  playFlipSound,
  playToppingSound,
  startBackgroundMusic,
} from './game-audio';
import {
  getPancakePoint,
} from './game-interaction';
import type { PancakePoint } from './game-interaction';
import {
  addTopping,
  createEmptyToppingCounts,
  getStreakTip,
  isOrderComplete,
} from './game-logic';

const SHIFT_LENGTH_SECONDS = 60;
const ORDER_TIME_BONUS_SECONDS = 5;
const MAX_MISTAKES = 3;
const ORDER_REWARD = 100;
const BAD_ORDER_DEDUCTION_PER_MISMATCH = 10;
const MIN_BAD_ORDER_REWARD = 10;
const GRILL_FLIPS_REQUIRED = 3;
const GRILL_ZONE_HALF_WIDTH = 15;
const GRILL_ZONE_SHRINK_PER_FLIP = 3;
const GRILL_METER_STEP = 2;
const GRILL_START_INTERVAL_MS = 30;
const GRILL_INTERVAL_REDUCTION_MS = 4;

const getGrillZone = (flipsCompleted: number) => {
  const halfWidth =
    GRILL_ZONE_HALF_WIDTH -
    Math.min(flipsCompleted, GRILL_FLIPS_REQUIRED - 1) *
      GRILL_ZONE_SHRINK_PER_FLIP;

  return { start: 50 - halfWidth, end: 50 + halfWidth };
};

type DraggedTool = {
  pointerId: number;
  topping: Topping;
  x: number;
  y: number;
  pancakePoint: PancakePoint | null;
  isOverPancake: boolean;
};

type PlacedTopping = {
  id: number;
  topping: Topping;
  x: number;
  y: number;
};

type GrillMeterState = {
  position: number;
  direction: 1 | -1;
};

const TOPPING_STAMP_ASSETS: Partial<Record<Topping, string>> = {
  blueberry: '/assets/toppings/blueberry-cluster.svg',
  strawberry: '/assets/toppings/strawberry.svg',
  cream: '/assets/toppings/whipped-cream.svg',
  butter: '/assets/toppings/butter.svg',
  syrup: '/assets/toppings/syrup-puddle.svg',
};

const BOWL_ASSETS: Partial<Record<Topping, string>> = {
  blueberry: '/assets/bowls/blueberries.svg',
  strawberry: '/assets/bowls/strawberries.svg',
  cream: '/assets/bowls/cream.svg',
  butter: '/assets/bowls/butter.svg',
};

export const App = () => {
  const [order, setOrder] = useState<Order>(() => getRandomOrder());
  const [seenCustomers, setSeenCustomers] = useState<string[]>([]);
  const [usedToppingCombinations, setUsedToppingCombinations] = useState<
    string[]
  >([]);
  const [selectedToppings, setSelectedToppings] = useState<ToppingCounts>(
    createEmptyToppingCounts
  );
  const [secondsLeft, setSecondsLeft] = useState(SHIFT_LENGTH_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shiftStarted, setShiftStarted] = useState(false);
  const [coins, setCoins] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [rating, setRating] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flipsCompleted, setFlipsCompleted] = useState(0);
  const [ordersServed, setOrdersServed] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot | null>(
    null
  );
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pancakeCooked, setPancakeCooked] = useState(false);
  const [grillMeter, setGrillMeter] = useState<GrillMeterState>({
    position: 0,
    direction: 1,
  });
  const [soundOn, setSoundOn] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopMusicRef = useRef<(() => void) | null>(null);
  const pancakeRef = useRef<HTMLDivElement>(null);
  const ingredientRowRef = useRef<HTMLDivElement>(null);
  const flipPositionRef = useRef<number | null>(null);
  const placementIdRef = useRef(0);
  const leaderboardSubmittedRef = useRef(false);
  const [placedToppings, setPlacedToppings] = useState<PlacedTopping[]>([]);
  const [draggedTool, setDraggedTool] = useState<DraggedTool | null>(null);
  const isGameOver = secondsLeft === 0 || mistakes >= MAX_MISTAKES;
  const celebrating =
    feedback.startsWith('Perfect!') || feedback.startsWith('Order served!');
  const missedOrder =
    feedback.startsWith('Not quite!') ||
    feedback.startsWith('Wrong order!') ||
    feedback.startsWith('Too raw!');
  const grillZone = getGrillZone(flipsCompleted);

  useEffect(() => {
    if (isGameOver || !shiftStarted) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => Math.max(0, currentSeconds - 1));
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isGameOver, shiftStarted]);

  useEffect(() => {
    if (!isGameOver || !shiftStarted || leaderboardSubmittedRef.current) {
      return;
    }

    leaderboardSubmittedRef.current = true;
    void trpc.leaderboard.submit
      .mutate({ moneyMade: coins, elapsedSeconds, ordersServed, rating })
      .then(setLeaderboard)
      .catch(() => setLeaderboardError(true));
  }, [isGameOver, shiftStarted, coins, elapsedSeconds, ordersServed, rating]);

  useEffect(() => {
    if (isGameOver || pancakeCooked) {
      return;
    }

    const timerId = window.setInterval(() => {
      setGrillMeter((current) => {
        const nextPosition =
          current.position + current.direction * GRILL_METER_STEP;

        if (nextPosition >= 100) {
          return { position: 100, direction: -1 };
        }
        if (nextPosition <= 0) {
          return { position: 0, direction: 1 };
        }

        return { ...current, position: nextPosition };
      });
    },
      Math.max(
        18,
        GRILL_START_INTERVAL_MS -
          flipsCompleted * GRILL_INTERVAL_REDUCTION_MS
      )
    );

    return () => window.clearInterval(timerId);
  }, [isGameOver, pancakeCooked, flipsCompleted]);

  useEffect(() => {
    if (isGameOver) {
      stopMusicRef.current?.();
      stopMusicRef.current = null;
    }
  }, [isGameOver]);

  useEffect(
    () => () => {
      stopMusicRef.current?.();
      stopMusicRef.current = null;
    },
    []
  );

  const handleAudioError = (error: unknown) => {
    console.error('Unable to enable game audio.', error);
    setSoundOn(false);
    setFeedback('Sound could not be enabled. Check your browser audio settings.');
  };

  const prepareAudio = () => {
    if (typeof window.AudioContext === 'undefined') {
      setSoundOn(false);
      setFeedback('Audio is unavailable in this browser.');
      return null;
    }

    try {
      const audioContext =
        audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = audioContext;

      const startMusic = () => {
        if (!stopMusicRef.current) {
          stopMusicRef.current = startBackgroundMusic(audioContext);
        }
      };

      if (audioContext.state === 'running') {
        startMusic();
      } else {
        void audioContext.resume().then(startMusic).catch(handleAudioError);
      }

      return audioContext;
    } catch (error: unknown) {
      handleAudioError(error);
      return null;
    }
  };

  const playSound = (topping: Topping) => {
    if (!soundOn) {
      return;
    }

    const audioContext = audioContextRef.current ?? prepareAudio();
    if (!audioContext) {
      return;
    }

    const play = () => {
      try {
        playToppingSound(audioContext, topping);
      } catch (error: unknown) {
        handleAudioError(error);
      }
    };

    if (audioContext.state === 'running') {
      play();
      return;
    }

    void audioContext.resume().then(play).catch(handleAudioError);
  };

  const playFlipEffect = (successful: boolean) => {
    if (!soundOn) return;

    const audioContext = audioContextRef.current ?? prepareAudio();
    if (!audioContext) return;

    const play = () => {
      try {
        playFlipSound(audioContext, successful);
      } catch (error: unknown) {
        handleAudioError(error);
      }
    };

    if (audioContext.state === 'running') {
      play();
      return;
    }

    void audioContext.resume().then(play).catch(handleAudioError);
  };

  const applyTopping = (topping: Topping, point: PancakePoint) => {
    setSelectedToppings((current) => addTopping(current, topping));
    const id = placementIdRef.current;
    placementIdRef.current += 1;
    setPlacedToppings((current) => [
      ...current,
      { id, topping, x: point.x, y: point.y },
    ]);
    setFeedback(`${TOPPINGS[topping].label} added!`);
    playSound(topping);
  };

  const pickUpTool = (
    event: ReactPointerEvent<HTMLButtonElement>,
    topping: Topping
  ) => {
    if (isGameOver || !pancakeCooked) {
      return;
    }

    if (soundOn) {
      prepareAudio();
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedTool({
      pointerId: event.pointerId,
      topping,
      x: event.clientX,
      y: event.clientY,
      pancakePoint: null,
      isOverPancake: false,
    });
    setFeedback('');
  };

  const moveTool = (event: ReactPointerEvent<HTMLElement>) => {
    const point = getPancakePoint(
      pancakeRef.current?.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );

    setDraggedTool((current) => {
      if (!current || current.pointerId !== event.pointerId) {
        return current;
      }

      return {
        ...current,
        x: event.clientX,
        y: event.clientY,
        pancakePoint: point,
        isOverPancake: point !== null,
      };
    });
  };

  const finishToolDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggedTool || draggedTool.pointerId !== event.pointerId) {
      return;
    }
    if (isGameOver) {
      setDraggedTool(null);
      return;
    }

    const point = getPancakePoint(
      pancakeRef.current?.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );
    if (!point) {
      setFeedback('Drop the topping over the pancake.');
      setDraggedTool(null);
      return;
    }

    applyTopping(draggedTool.topping, point);

    setDraggedTool(null);
  };

  const cancelToolDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (draggedTool?.pointerId === event.pointerId) {
      setDraggedTool(null);
    }
  };

  const handleToolKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    topping: Topping
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (isGameOver || !pancakeCooked) {
      return;
    }

    const point = { x: 50, y: 50 };
    applyTopping(topping, point);
  };

  const flipPancake = (position = grillMeter.position) => {
    if (isGameOver || pancakeCooked) {
      return;
    }

    setShiftStarted(true);

    const successful =
      position >= grillZone.start && position <= grillZone.end;
    playFlipEffect(successful);

    if (successful) {
      const nextFlipCount = flipsCompleted + 1;
      setFlipsCompleted(nextFlipCount);
      setGrillMeter({ position: 0, direction: 1 });

      if (nextFlipCount >= GRILL_FLIPS_REQUIRED) {
        setPancakeCooked(true);
        setFeedback('Three golden flips! Now decorate the pancake.');
      } else {
        setFeedback(
          `Golden flip ${nextFlipCount}/${GRILL_FLIPS_REQUIRED}! The meter speeds up and the green area shrinks.`
        );
      }
      return;
    }

    setMistakes((currentMistakes) => currentMistakes + 1);
    setStreak(0);
    setFeedback('Too raw! Try to flip when the marker reaches the gold zone.');
  };

  const clearPancake = () => {
    if (isGameOver || !pancakeCooked) {
      return;
    }

    setSelectedToppings(createEmptyToppingCounts());
    setPlacedToppings([]);
    setFeedback('');
  };

  const serveOrder = () => {
    if (isGameOver || !pancakeCooked) {
      return;
    }

    if (isOrderComplete(order, selectedToppings)) {
      const nextStreak = streak + 1;
      const tip = getStreakTip(nextStreak);
      const combinationKey = getToppingCombinationKey(order.toppings);
      const nextSeenCustomers = [...seenCustomers, order.customer];
      const nextUsedCombinations = [
        ...usedToppingCombinations,
        combinationKey,
      ];
      const customerExclusions =
        nextSeenCustomers.length >= ORDERS.length
          ? [order.customer]
          : nextSeenCustomers;
      const combinationExclusions =
        nextUsedCombinations.length >= TOPPING_COMBINATION_COUNT
          ? [combinationKey]
          : nextUsedCombinations;

      setCoins((currentCoins) => currentCoins + ORDER_REWARD + tip);
      setSecondsLeft((currentSeconds) => currentSeconds + ORDER_TIME_BONUS_SECONDS);
      setStreak(nextStreak);
      setOrdersServed((currentOrders) => currentOrders + 1);
      setRating((currentRating) => Math.min(5, currentRating + 1));
      setSeenCustomers(customerExclusions);
      setUsedToppingCombinations(combinationExclusions);
      setOrder(
        getRandomOrder(customerExclusions, combinationExclusions)
      );
      setSelectedToppings(createEmptyToppingCounts());
      setPlacedToppings([]);
      setPancakeCooked(false);
      setFlipsCompleted(0);
      setGrillMeter({ position: 0, direction: 1 });
      setFeedback(
        tip > 0
          ? `Perfect! +${ORDER_REWARD + tip} coins, including a streak tip!`
          : `Order served! +${ORDER_REWARD} coins.`
      );
      return;
    }

    setMistakes((currentMistakes) => currentMistakes + 1);
    setRating((currentRating) => Math.max(0, currentRating - 1.5));
    setStreak(0);
    const toppingMismatch = TOPPING_ORDER.reduce(
      (total, topping) =>
        total +
        Math.abs(
          selectedToppings[topping] - (order.toppings[topping] ?? 0)
        ),
      0
    );
    const badOrderReward = Math.max(
      MIN_BAD_ORDER_REWARD,
      ORDER_REWARD - toppingMismatch * BAD_ORDER_DEDUCTION_PER_MISMATCH
    );
    setCoins((currentCoins) => currentCoins + badOrderReward);
    const missedCombination = getToppingCombinationKey(order.toppings);
    const missedCustomers = [...seenCustomers, order.customer];
    const missedCombinations = [
      ...usedToppingCombinations,
      missedCombination,
    ];
    const customerExclusions =
      missedCustomers.length >= ORDERS.length
        ? [order.customer]
        : missedCustomers;
    const combinationExclusions =
      missedCombinations.length >= TOPPING_COMBINATION_COUNT
        ? [missedCombination]
        : missedCombinations;
    setSeenCustomers(customerExclusions);
    setUsedToppingCombinations(combinationExclusions);
    setOrder(getRandomOrder(customerExclusions, combinationExclusions));
    setSelectedToppings(createEmptyToppingCounts());
    setPlacedToppings([]);
    setPancakeCooked(false);
    setFlipsCompleted(0);
    setGrillMeter({ position: 0, direction: 1 });
    setFeedback(
      `Wrong order! +${badOrderReward} coins and 1.5 stars. A new customer is waiting.`
    );
  };

  const restartShift = () => {
    setSeenCustomers([]);
    setUsedToppingCombinations([]);
    setOrder(getRandomOrder());
    setSelectedToppings(createEmptyToppingCounts());
    setSecondsLeft(SHIFT_LENGTH_SECONDS);
    setElapsedSeconds(0);
    setShiftStarted(false);
    setCoins(0);
    setMistakes(0);
    setRating(0);
    setStreak(0);
    setFlipsCompleted(0);
    setOrdersServed(0);
    leaderboardSubmittedRef.current = false;
    setLeaderboard(null);
    setLeaderboardError(false);
    setPancakeCooked(false);
    setGrillMeter({ position: 0, direction: 1 });
    setPlacedToppings([]);
    setDraggedTool(null);
    setFeedback('');
  };

  const draggedPoint = draggedTool?.pancakePoint ?? null;

  return (
    <main
      className="game-shell"
      onPointerMove={moveTool}
      onPointerUp={finishToolDrag}
      onPointerCancel={cancelToolDrag}
    >
      <header className="game-header">
        <div>
          <p className="eyebrow">THE LITTLE PANCAKE COUNTER</p>
          <h1>Pankakeria</h1>
          <p className="header-subtitle">
            A tiny shift. A whole lot of toppings.
          </p>
        </div>
        <div className="shift-stats" aria-label="Shift stats">
          <button
            className="sound-toggle"
            type="button"
            onClick={() => {
              if (soundOn) {
                setSoundOn(false);
                stopMusicRef.current?.();
                stopMusicRef.current = null;
                return;
              }

              setSoundOn(true);
              prepareAudio();
            }}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
          >
            {soundOn ? '🔊' : '🔇'}
            <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>
          <div
            className={
              secondsLeft <= 15 ? 'stat-card stat-urgent' : 'stat-card'
            }
          >
            <span className="stat-label">TIME</span>
            <strong aria-label={`${secondsLeft} seconds remaining`}>
              {secondsLeft}s
            </strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">MISTAKES</span>
            <strong aria-label={`${mistakes} of ${MAX_MISTAKES} mistakes`}>
              {'❤️'.repeat(MAX_MISTAKES - mistakes)}
              {'🤍'.repeat(mistakes)}
            </strong>
          </div>
          <div className="stat-card coin-stat">
            <span className="stat-label">JAR</span>
            <span
              className={`coin-jar${coins > 0 ? ' coin-jar-filled' : ''}`}
              style={{
                background: `linear-gradient(0deg, #e9b13e 0 ${Math.min(12 + coins / 100 * 14, 75)}%, #fff0b9 ${Math.min(12 + coins / 100 * 14, 75)}%)`,
              }}
              aria-hidden="true"
            >
              {coins > 0 && (
                <span className="coin-jar-coins">
                  {Array.from(
                    { length: Math.min(3, Math.max(1, Math.ceil(coins / 100))) },
                    (_, index) => <i key={index}>🪙</i>
                  )}
                </span>
              )}
            </span>
            <strong aria-label={`${coins} coins`}>{coins}</strong>
          </div>
        </div>
      </header>

      <div className="game-content">
        <section
          className={`counter-card${celebrating ? ' counter-card-celebrate' : ''}${missedOrder ? ' counter-card-miss' : ''}`}
          aria-label="Pancake counter"
        >
          <div className="pancake-area">
            <div className="plate" aria-hidden="true">
              <div className="pancake-target" ref={pancakeRef}>
                <div
                  className={`pancake${pancakeCooked ? 'pancake-cooked' : ''}`}
                >
                  <img
                    className="pancake-art"
                    src="/assets/pancake.svg"
                    alt=""
                    draggable={false}
                  />
                  <div
                    className="pancake-toppings"
                    aria-label="Decorated pancake"
                    role="img"
                  >
                    {placedToppings.map((placed) => {
                      const stampAsset = TOPPING_STAMP_ASSETS[placed.topping];

                      return (
                        <span
                          key={placed.id}
                          className={`placed-topping placed-topping-${placed.topping}`}
                          style={{
                            left: `${placed.x}%`,
                            top: `${placed.y}%`,
                          }}
                        >
                          {stampAsset && (
                            <img
                              className="placed-topping-art"
                              src={stampAsset}
                              alt=""
                              draggable={false}
                            />
                          )}
                        </span>
                      );
                    })}
                    {draggedTool?.isOverPancake && draggedPoint && (
                      <span
                        className={`placement-preview${draggedTool.topping === 'syrup' ? ' placement-preview-syrup' : ''}`}
                        style={{
                          left: `${draggedPoint.x}%`,
                          top: `${draggedPoint.y}%`,
                        }}
                      >
                        {TOPPING_STAMP_ASSETS[draggedTool.topping] && (
                          <img
                            src={TOPPING_STAMP_ASSETS[draggedTool.topping]}
                            alt=""
                            draggable={false}
                          />
                        )}
                      </span>
                    )}
                    {placedToppings.length === 0 &&
                      !(draggedTool && draggedTool.isOverPancake) && (
                        <span className="pancake-placeholder">
                          {pancakeCooked
                            ? 'ready for toppings!'
                            : 'ready to grill!'}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <p className="plate-caption">
              {pancakeCooked
                ? 'Golden and ready to decorate'
                : 'On the griddle'}
            </p>
          </div>

          <div className="order-ticket">
            <div className="ticket-heading">
              <span>ORDER</span>
              <span className="ticket-customer">
                <span aria-hidden="true">{order.avatar}</span>
                <span className="ticket-customer-name">{order.customer}</span>
              </span>
            </div>
            <h3 id="order-heading">Please add:</h3>
            <ul className="order-list">
              {TOPPING_ORDER.map((topping) => {
                const requestedCount = order.toppings[topping] ?? 0;
                if (requestedCount === 0) return null;

                return (
                  <li key={topping}>
                    <span>
                      <span className="order-icon" aria-hidden="true">
                        {TOPPINGS[topping].icon}
                      </span>
                      <span className="order-label">
                        {TOPPINGS[topping].label}
                      </span>
                    </span>
                    <strong>x {requestedCount}</strong>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grill-station">
            <div className="grill-copy">
              <div>
                  <p className="eyebrow">
                    QUICK GRILL · FLIP {Math.min(flipsCompleted + 1, GRILL_FLIPS_REQUIRED)}/{GRILL_FLIPS_REQUIRED}
                  </p>
                <h2>
                  {pancakeCooked ? 'Golden and ready!' : 'Catch the gold zone'}
                </h2>
              </div>
              <span aria-hidden="true">{pancakeCooked ? '✨' : '🔥'}</span>
            </div>
            {pancakeCooked ? (
              <div className="grill-complete" role="status">
                <span className="grill-complete-icon" aria-hidden="true">
                  ✓
                </span>
                <span>
                  <strong>Three perfect flips!</strong>
                  <small>Now add the customer's toppings.</small>
                </span>
              </div>
            ) : (
              <>
                <div
                  className="grill-meter"
                  role="progressbar"
                  aria-label="Pancake grill timing"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(grillMeter.position)}
                >
                  <span
                    className="grill-zone"
                    style={{
                      left: `${grillZone.start}%`,
                      width: `${grillZone.end - grillZone.start}%`,
                    }}
                  />
                  <span
                    className={`grill-indicator${grillMeter.position >= grillZone.start && grillMeter.position <= grillZone.end ? ' grill-indicator-target' : ''}`}
                    style={{ left: `${grillMeter.position}%` }}
                  />
                </div>
                <button
                  className="flip-button"
                  type="button"
                  onPointerDown={() => {
                    flipPositionRef.current = grillMeter.position;
                  }}
                  onPointerCancel={() => {
                    flipPositionRef.current = null;
                  }}
                  onClick={() => {
                    flipPancake(flipPositionRef.current ?? grillMeter.position);
                    flipPositionRef.current = null;
                  }}
                  disabled={isGameOver}
                >
                  Flip pancake
                </button>
              </>
            )}
          </div>

          <div className="topping-station">
            <div className="station-heading">
              <div>
                <p className="eyebrow">INGREDIENT BOWLS</p>
                <h2>{pancakeCooked ? 'Spoon onto pancake' : 'Grill to unlock'}</h2>
              </div>
              <button
                className="clear-button"
                type="button"
                onClick={clearPancake}
                disabled={isGameOver || !pancakeCooked}
              >
                Clear plate
              </button>
            </div>

            <div className="ingredient-row-controls">
              <button
                className="ingredient-scroll-button ingredient-back-button"
                type="button"
                aria-label="Show the previous two ingredients"
                title="Previous ingredients"
                onClick={() => {
                  const row = ingredientRowRef.current;
                  if (!row) return;

                  const rowLeft = row.getBoundingClientRect().left;
                  const buttons = Array.from(
                    row.querySelectorAll<HTMLButtonElement>('.spoon-tool')
                  );
                  const currentIndex = buttons.findIndex(
                    (button) => button.getBoundingClientRect().left >= rowLeft - 1
                  );
                  const previousIndex =
                    currentIndex >= 2 ? currentIndex - 2 : buttons.length - 2;
                  const previousButton = buttons[Math.max(0, previousIndex)];
                  if (!previousButton) return;

                  const previousLeft =
                    row.scrollLeft +
                    previousButton.getBoundingClientRect().left -
                    rowLeft;
                  row.scrollTo({ left: previousLeft, behavior: 'smooth' });
                }}
              >
                <span aria-hidden="true">←</span>
              </button>
              <div
                className="ingredient-bowls"
                ref={ingredientRowRef}
                role="group"
                aria-label="Ingredient bowls with draggable spoons"
              >
                {TOPPING_ORDER.map((topping) => (
                  <button
                    className={`spoon-tool spoon-tool-${topping}${draggedTool?.topping === topping ? ' spoon-tool-picked' : ''}`}
                    type="button"
                    key={topping}
                    onPointerDown={(event) => pickUpTool(event, topping)}
                    onKeyDown={(event) => handleToolKeyboard(event, topping)}
                    disabled={isGameOver || !pancakeCooked}
                    aria-label={`Pick up the ${TOPPINGS[topping].label} spoon and drag it over the pancake to ${TOPPINGS[topping].action}`}
                    draggable={false}
                  >
                    <span className="tool-art" aria-hidden="true">
                      {BOWL_ASSETS[topping] && (
                        <span className="ingredient-bowl">
                          <img
                            className="bowl-ingredient"
                            src={BOWL_ASSETS[topping]}
                            alt=""
                            draggable={false}
                          />
                        </span>
                      )}
                      <img
                        className="tool-asset"
                        src={TOPPINGS[topping].toolAsset}
                        alt=""
                        draggable={false}
                      />
                      <strong className="topping-count">
                        {selectedToppings[topping]}
                      </strong>
                    </span>
                    <span className="tool-label">{TOPPINGS[topping].label}</span>
                    <span className="tool-action">
                      {TOPPINGS[topping].action}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="ingredient-scroll-button ingredient-next-button"
                type="button"
                aria-label="Show the next two ingredients"
                title="Next ingredients"
                onClick={() => {
                  const row = ingredientRowRef.current;
                  if (!row) return;

                  const rowLeft = row.getBoundingClientRect().left;
                  const buttons = Array.from(
                    row.querySelectorAll<HTMLButtonElement>('.spoon-tool')
                  );
                  const currentIndex = buttons.findIndex(
                    (button) => button.getBoundingClientRect().left >= rowLeft - 1
                  );
                  const nextIndex =
                    currentIndex + 2 < buttons.length ? currentIndex + 2 : 0;
                  const nextButton = buttons[nextIndex];
                  if (!nextButton) return;

                  const nextLeft =
                    row.scrollLeft +
                    nextButton.getBoundingClientRect().left -
                    rowLeft;
                  row.scrollTo({
                    left: nextLeft,
                    behavior: 'smooth',
                  });
                }}
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <button
              className="serve-button"
              type="button"
              onClick={serveOrder}
              disabled={isGameOver || !pancakeCooked}
            >
              Serve this pancake <span aria-hidden="true">→</span>
            </button>
            <p className="feedback-message" aria-live="polite">
              {feedback ||
                (pancakeCooked
                  ? 'Pick up a spoon and drag it onto the pancake.'
                  : 'Flip in the gold zone, decorate, then serve!')}
            </p>
          </div>
        </section>
      </div>

      {draggedTool &&
        createPortal(
          <div
            className={`drag-ghost${draggedTool.isOverPancake ? 'drag-ghost-over' : ''}`}
            style={{ left: draggedTool.x, top: draggedTool.y }}
            aria-hidden="true"
          >
            <img
              className={
                draggedTool.topping === 'syrup' ? '' : 'drag-ghost-spoon'
              }
              src={TOPPINGS[draggedTool.topping].toolAsset}
              alt=""
            />
            <span>
              {draggedTool.topping === 'syrup' ? 'Drop syrup' : 'Drop on pancake'}
            </span>
          </div>,
          document.body
        )}

      <footer className="game-footer">
        <span>Orders served: {ordersServed}</span>
        <span
          className="rating-display"
          role="img"
          aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
        >
          <span className="rating-stars" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => {
              const value = rating - index;
              const starClass =
                value >= 1
                  ? 'rating-star-full'
                  : value >= 0.5
                    ? 'rating-star-half'
                    : 'rating-star-empty';

              return (
                <span className={starClass} key={index}>
                  ★
                </span>
              );
            })}
          </span>
          <strong>{rating.toFixed(1)}</strong>
        </span>
      </footer>

      {isGameOver && (
        <div className="game-over-backdrop">
          <section
            className="game-over-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-heading"
          >
            <span className="game-over-emoji" aria-hidden="true">
              {mistakes >= MAX_MISTAKES ? '🥞' : '🔔'}
            </span>
            <p className="eyebrow">SHIFT COMPLETE</p>
            <h2 id="game-over-heading">
              {mistakes >= MAX_MISTAKES
                ? 'The rush got you!'
                : 'Time for a break!'}
            </h2>
            <p>
              You served {ordersServed}{' '}
              {ordersServed === 1 ? 'order' : 'orders'} and finished with{' '}
              <strong>{coins} coins</strong>.
            </p>
            <div className="end-run-stats" aria-label="Your shift results">
              <div>
                <span>Money made</span>
                <strong>{coins} coins</strong>
              </div>
              <div>
                <span>Orders</span>
                <strong>{ordersServed}</strong>
              </div>
              <div>
                <span>Time taken</span>
                <strong>{elapsedSeconds}s</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>{rating.toFixed(1)} / 5 ★</strong>
              </div>
            </div>
            {leaderboard?.personalBest && (
              <section className="personal-best-card" aria-label="Your best shift">
                <span className="personal-best-label">YOUR BEST</span>
                <div className="personal-best-content">
                  <span className="reddit-avatar" aria-hidden="true">
                    {leaderboard.personalBest.avatarUrl && (
                      <img
                        src={leaderboard.personalBest.avatarUrl}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span>
                      {leaderboard.personalBest.username
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  </span>
                  <div className="personal-best-info">
                    <strong>u/{leaderboard.personalBest.username}</strong>
                    <span>{leaderboard.personalBest.moneyMade} coins</span>
                    <small>
                      {leaderboard.personalBest.ordersServed} orders ·{' '}
                      {leaderboard.personalBest.elapsedSeconds}s
                    </small>
                  </div>
                </div>
              </section>
            )}
            <section className="leaderboard-panel" aria-labelledby="leaderboard-heading">
              <div className="leaderboard-heading">
                <h3 id="leaderboard-heading">Top players</h3>
                <p>Top 10 · each Redditor’s best net earnings · coins, faster time, rating, orders</p>
              </div>
              {isGameOver && !leaderboard && !leaderboardError && (
                <p className="leaderboard-message">Saving your best shift…</p>
              )}
              {leaderboardError && (
                <p className="leaderboard-message">Couldn’t load the leaderboard right now.</p>
              )}
              {!leaderboardError && leaderboard && (
                <>
                  {leaderboard.personalBest && (
                    <p className="personal-best personal-best-with-avatar">
                      <span className="reddit-avatar" aria-hidden="true">
                        {leaderboard.personalBest.avatarUrl && (
                          <img
                            src={leaderboard.personalBest.avatarUrl}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span>
                          {leaderboard.personalBest.username
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      </span>
                      Your best: {leaderboard.personalBest.moneyMade} coins ·{' '}
                      {leaderboard.personalBest.elapsedSeconds}s ·{' '}
                      {leaderboard.personalBest.ordersServed} orders ·{' '}
                      {leaderboard.personalBest.rating.toFixed(1)} ★
                    </p>
                  )}
                  {leaderboard.entries.length > 0 ? (
                    <>
                      <ol className="leaderboard-list">
                        {leaderboard.entries.map((entry, index) => (
                          <li
                            className={entry.username.toLowerCase() === leaderboard.username?.toLowerCase() ? 'leaderboard-row leaderboard-current-user' : 'leaderboard-row'}
                            key={entry.username}
                          >
                            <span>{index + 1}</span>
                            <span className="reddit-avatar" aria-hidden="true">
                              {entry.avatarUrl && (
                                <img
                                  src={entry.avatarUrl}
                                  alt=""
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{entry.username.slice(0, 1).toUpperCase()}</span>
                            </span>
                            <strong>u/{entry.username}</strong>
                            <span>{entry.moneyMade}</span>
                            <span>{entry.elapsedSeconds}s</span>
                            <span>{entry.ordersServed}</span>
                            <span>{entry.rating.toFixed(1)} ★</span>
                          </li>
                        ))}
                      </ol>
                      {leaderboard.entries.length === 1 &&
                        leaderboard.username &&
                        leaderboard.entries[0]?.username.toLowerCase() ===
                          leaderboard.username.toLowerCase() && (
                          <p className="leaderboard-message">
                            Your best is saved. Other players appear after they
                            finish a shift on the shared board.
                          </p>
                        )}
                    </>
                  ) : leaderboard.username ? (
                    <p className="leaderboard-message">You’re the first on the board!</p>
                  ) : (
                    <p className="leaderboard-message">Sign in to Reddit to save your best shift.</p>
                  )}
                </>
              )}
            </section>
            <button
              className="serve-button replay-button"
              type="button"
              onClick={restartShift}
            >
              Play another shift
            </button>
          </section>
        </div>
      )}
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
