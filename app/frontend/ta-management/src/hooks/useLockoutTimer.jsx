/*
 * Hook to manage Password Reset lockout/timeout state
 * What it does:
 * - Keeps track of if the user is locked out and how much time remains
 * - Updates time remaining in real time pulling data from localStorage so user knows how much time is left
 * - Returns timeout status, remaining time, and a manual refresh function (purpose of this is to force
 * React to update the page that the timeout occurs on right when it happens, without requiring a page refresh)
*/

import { getLockoutInfo } from "@/logic/password-reset-lockout";
import { useCallback, useEffect, useState } from "react";

export function useLockoutTimer() {
    const [lockedOut, setLockedOut] = useState(false) // whether or not user has exceeded max # of attempts
    const [lockoutTime, setLockoutTime] = useState(null) // if user is currently locked out, how much time remains?

    const checkLockoutStatus = useCallback(() => {
        const { lockedOut, lockoutTime } = getLockoutInfo();
        setLockedOut(lockedOut);
        setLockoutTime(lockoutTime);
    }, []);

    useEffect(() => {
        checkLockoutStatus();
    }, [checkLockoutStatus]);

    useEffect(() => {
        if(!lockedOut) return;

        const interval = setInterval(() => {
            checkLockoutStatus();
        }, 1000);

        return () => clearInterval(interval);
    }, [lockedOut, checkLockoutStatus])
    
    return { lockedOut, lockoutTime, checkLockoutStatus };
}