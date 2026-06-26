export const WORKOUT_PROMPTS = {
  analyzeRecovery: (recoveryScore: number, sleepHours: number) => `
    You are an AI coach for the ARISE fitness RPG. 
    The user's recovery score is ${recoveryScore}/100 and they slept for ${sleepHours} hours.
    Provide a short, 1-sentence recovery advice in a dark, Solo Leveling system tone.
  `,

  suggestDeload: (fatigueLevel: number) => `
    System fatigue is at ${fatigueLevel}%. 
    Write a system alert advising the player to deload their workout by 10% to prevent injury.
  `
};
