const AUTHKEY_API_KEY = process.env.NEXT_PUBLIC_AUTHKEY_API_KEY;
const AUTHKEY_SID = process.env.NEXT_PUBLIC_AUTHKEY_SID;

export const isAuthkeyConfigured = !!(AUTHKEY_API_KEY && AUTHKEY_SID);

export interface SendOtpResponse {
    LogID?: string;
    Message?: string;
}

export interface VerifyOtpResponse {
    Status: string; // "Success" or "Error"
    Message: string;
}

export const sendOTP = async (mobile: string, countryCode: string = '91'): Promise<string> => {
    if (!isAuthkeyConfigured) {
        throw new Error("Authkey is not configured. Please check environment variables.");
    }

    // Authkey requires country code without '+' for the parameter
    const cleanCountryCode = countryCode.replace('+', '');
    
    // Using a proxy or direct fetch if CORS allows. For Next.js, this might need a server action or route handler to avoid CORS if called from client.
    // However, for this demo/setup, I'll implement the fetch.
    const url = `https://api.authkey.io/request?authkey=${AUTHKEY_API_KEY}&mobile=${mobile}&country_code=${cleanCountryCode}&sid=${AUTHKEY_SID}`;
    
    const response = await fetch(url);
    const data: SendOtpResponse = await response.json();

    if (data.LogID) {
        return data.LogID;
    } else {
        throw new Error(data.Message || "Failed to send OTP via Authkey");
    }
};

export const verifyOTP = async (otp: string, logId: string): Promise<boolean> => {
    if (!isAuthkeyConfigured) {
        throw new Error("Authkey is not configured.");
    }

    const url = `https://console.authkey.io/api/2fa_verify.php?authkey=${AUTHKEY_API_KEY}&channel=SMS&otp=${otp}&logid=${logId}`;
    
    const response = await fetch(url);
    const result: VerifyOtpResponse = await response.json();

    return result.Status === "Success";
};
