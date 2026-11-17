import "server-only"

import arcjet, {
    detectBot,
    fixedWindow,
    protectSignup,
    request,
    sensitiveInfo,
    shield,
    slidingWindow
} from "@arcjet/next";
import { env } from "./env";

export {
    detectBot,
    fixedWindow,
    protectSignup,
    request,
    sensitiveInfo,
    shield,
    slidingWindow
}

export default arcjet({
    key: env.ARCJET_KEY,
    characteristics: ["fingerprint"],
    rules: [
        shield({ mode: "LIVE" }),
    ],
})