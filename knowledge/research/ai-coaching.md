# AI Coaching Patterns Research Reference

## What Works in AI Coaching (From Noom, Whoop, Oura, Fitbod)

| Product | Core Mechanic | Why It Works |
|---------|--------------|-------------|
| Noom | CBT + AI + hybrid coaching | 65-75% retention at 6 months vs 25-30% industry avg |
| Whoop | Recovery-based strain management | Daily Outlook: proactive morning recs on push/rest |
| Oura | Readiness scoring (HRV, temp, sleep) | Passive tracking + AI advisor for cross-metric insights |
| Fitbod | Anticipatory fatigue modeling | Predicts fatigue before you feel it. Adjusts daily. |
| Freeletics | Real-time difficulty recalibration | Reads "too easy/hard" feedback, instantly adapts |

**Retention equation:** Personalization + Low Friction + Visible Progress + Social Accountability + Adaptive Difficulty

## Multi-Agent Architecture (Google PH-LLM, Nature Medicine 2025)

| Agent | Role |
|-------|------|
| Conversational (Coordinator) | Intent understanding, routing, response generation |
| Data Science (Analyst) | Fetches, analyzes, summarizes data across domains |
| Domain Expert (Specialist) | Generates personalized plans, adapts based on progress |

PH-LLM outperformed human experts: 79% vs 76% sleep medicine, 88% vs 71% fitness.

## Push vs Back Off — Decision Framework

| Signal | Action |
|--------|--------|
| Completing ahead of schedule | Increase difficulty 10-15% |
| Responding to check-ins quickly | Maintain or slightly increase cadence |
| Ignoring 2+ check-ins | Reduce frequency, lighter touch |
| Streak broken after long run | Compassionate acknowledgment. Total progress framing. |
| Reports "too hard" | Immediately reduce. Rebuild confidence. |
| Asks for more challenge | Increase substantially — self-aware and ready |
| Recovery signals poor | Override goals. Rest. |

## Memory Architecture (5 Layers)

| Layer | What to Store | Update Frequency |
|-------|-------------|-----------------|
| Profile | Demographics, goals, preferences, constraints | On change |
| Session | Conversation history, feedback, questions | Every session |
| Performance | Habit completion, energy scores, streaks | Daily |
| Strategy | What was recommended, what was followed, effectiveness | Weekly |
| Behavioral | Response times, engagement trends, dropout risk | Continuous |

## Detecting Strategy Failure

| Signal | Pivot Action |
|--------|-------------|
| Compliance dropping 2+ weeks | Switch strategy category entirely, not just tweak |
| Metrics plateauing despite compliance | Introduce periodization or recovery phase |
| Sentiment declining in reflections | Address motivation before continuing program |
| Time between sessions increasing | Reduce friction, simplify asks, lead with value |

## What Doesn't Work

| Failure Mode | How to Avoid |
|-------------|-------------|
| Notification fatigue | Hard cap 2-3 touchpoints/day. Batch messages. |
| Over-tracking anxiety (Orthosomnia) | Show trends not daily scores. Normalize variation. |
| Generic advice | Ground every rec in user's actual data, not population averages |
| Streak tyranny | Use "habit strength" not raw streaks. Missed days = neutral data. |
| All push, no pull | Lead with insights ("Sleep improved 12%") before asking for action |
| No graceful degradation | Work with incomplete data. Never punish gaps. |
| Over-reliance on AI | Ask "what do you think?" before advising. Build user's own judgment. |

## Key Design Principle
> Cap touchpoints ruthlessly. 2-3/day max. Batch agent outputs. Lead with value, not asks. The moment the system feels like a nag, Dan will abandon it.
