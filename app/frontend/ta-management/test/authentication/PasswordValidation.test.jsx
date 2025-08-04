/*
* Unit tests of password validation function that is used by ResetPassword
* (and in future, should be used by Create Account to ensure consistency)
*/
import { getPasswordValidationErrors } from "@/pages/ResetPassword/NewPasswordStep";
import { describe, it, expect } from "vitest"

describe('Password Validation', () => {
    // Bad input cases, error messages expected
    it('fails if password/confirm password is empty', () => {
        const errors = getPasswordValidationErrors("", "");
        expect(errors.password).toBe("Password is required");
        expect(errors.confirm).toBe("Confirm Password is required");
    });

    it('fails if password is too short', () => {
        const errors = getPasswordValidationErrors("Ab1!", "Ab1!");
        expect(errors.password).toBe("Password must be at least 8 characters in length");
    })

    it('fails if password does not contain uppercase letter', () => {
        const errors = getPasswordValidationErrors("password1!", "password1!");
        expect(errors.password).toBe("Password must include at least one of each: uppercase letter, lowercase letter, number, and symbol");
    })

    it('fails if password does not contain lowercase letter', () => {
        const errors = getPasswordValidationErrors("HELLOWORLD$1", "HELLOWORLD$1");
        expect(errors.password).toBe("Password must include at least one of each: uppercase letter, lowercase letter, number, and symbol");
    })

    it('fails if password does not contain number', () => {
        const errors = getPasswordValidationErrors("HelloKitty*", "HelloKitty*");
        expect(errors.password).toBe("Password must include at least one of each: uppercase letter, lowercase letter, number, and symbol");
    })

    it('fails if password does not contain symbol', () => {
        const errors = getPasswordValidationErrors("Lightning100", "Lightning100");
        expect(errors.password).toBe("Password must include at least one of each: uppercase letter, lowercase letter, number, and symbol");
    })

    it('fails if passwords do not match', () => {
        const errors = getPasswordValidationErrors("Coffeeisgood#1", "Coffeeisgreat#2");
        expect(errors.confirm).toBe("Passwords must match");
    })

    // Good input cases, no errors expected
    const validPasswords = [
        "StrongPass1!",
        "Aa1@aaaaa",
        "123Aa!@#",
        "Valid$Pass9", 
        "Zz9#goodstuff",
        "#*&aB39)"
    ]

    it.each(validPasswords)("accepts valid password: %s", (password) => {
        const errors = getPasswordValidationErrors(password, password);
        expect(errors).toEqual({}); // should not have any errors since valid & matching passwords
    })
})