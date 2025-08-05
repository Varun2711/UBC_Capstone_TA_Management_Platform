/*
 * Utility file to improve security of Password Reset by adding a timeout
 * What it does: 
 * - Restricts # of times a user can input wrong student/employee id (3 attempts allowed)
 * - When max # of attempts is reached, they are prevented from continuing their password 
 * reset operation, and are prevented from initiating a new password reset operation.
 * - They can try again after 5 minutes has ellapsed
 */

// constants
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes, in ms
const LOCKOUT_TIMESTAMP_KEY = "resetpassword_lockout_until"; // access how long current user is locked out in localStorage
const ATTEMPTS_KEY = "resetpassword_failed_attempts"; // access # of failed verification attempts in localStorage

// Helper fn. to record failed verification attempt to localStorage and initiate lockout if reached max # of attempts
// Returns true if this attempt resulted in a lockout, false if still under the limit
export function recordFailedAttempt() {
    // get # of failed attempts from localStorage, or if none, set to 0
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY)) || 0;
    
    // increment # of attempts and update localStorage
    const updatedAttempts = attempts + 1;
    localStorage.setItem(ATTEMPTS_KEY, updatedAttempts);

    // check if reached max # of attempts, and if so, initiate lockout
    if (updatedAttempts >= MAX_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, lockoutUntil);
        return true;
    } 
    return false;
}

// Helper fn to reset failed attempts counter
export function resetFailedAttempts() {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}

// Getter for failed attempts
export function getFailedAttempts() {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY)) || 0;
}

// Helper fn to check if user is currently locked out
export function getLockoutInfo() {
    // Get how much time they have from localStorage (if not locked out, set to 0)
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY)) || 0;
    
    // Check if still has time remaining and return how long
    const now = Date.now();
    if (now < lockoutUntil) {
        return {
            lockedOut: true,
            lockoutTime: lockoutUntil - now,
        };
    }

    // But if no time remaining, clear lockout stuff from localStorage and return false
    resetFailedAttempts();

    return {
        lockedOut: false,
        lockoutTime: 0,
    };
}

// Helper fn to format time from ms into mm:ss (user-friendly)
export function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor((totalSeconds % 60));
    
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}