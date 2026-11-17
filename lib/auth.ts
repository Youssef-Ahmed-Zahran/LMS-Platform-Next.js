import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },
    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
    },
    
    plugins: [
        emailOTP({ 
            async sendVerificationOTP({ email, otp }) {
                const { error } = await resend.emails.send({
                    from: 'LMS <onboarding@resend.dev>',
                    to: [email],
                    subject: 'LMS - Verify your email',
                    html: `<p>Your Verification Code: <strong>${otp}</strong></p>`
                });
                if (error) {
                    console.error('[Resend] Failed to send OTP email:', error);
                }
            }, 
        }) ,
        admin(), 
    ]
});
