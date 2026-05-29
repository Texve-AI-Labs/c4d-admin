import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { onMessage } from "firebase/messaging";
import { FirebaseMessaging, requestToken } from "@/configs/firebaseConfig";
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // Import Heroicons

const parseAdminDiscountEvent = (payload = {}) => {
    const data = payload?.data || {};
    const rawData = data?.data;
    let parsed = {};

    if (typeof rawData === "string" && rawData.trim()) {
        try {
            parsed = JSON.parse(rawData);
        } catch (error) {
            parsed = {};
        }
    } else if (rawData && typeof rawData === "object") {
        parsed = rawData;
    }

    const type = String(parsed?.type || data?.type || "").toUpperCase();
    const status = String(parsed?.status || data?.status || "").toUpperCase();
    const quoteRef = String(parsed?.quoteRef || data?.quoteRef || "").trim();
    const discountId = parsed?.discountId || data?.discountId || "";

    if (type !== "ADMIN_DISCOUNT_APPROVED" && status !== "APPROVED" && status !== "AUTO_APPROVED") {
        return null;
    }

    return { type, status, quoteRef, discountId };
};

const buildNotificationMessage = (payload = {}) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    const title = notification?.title || data?.title || "New Notification";
    let body = notification?.body || data?.body || "";

    if (!body) {
        body = "You have a new message";
    }

    return { title, body };
};

const FcmToast = () => {
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ body: "", title: "" });
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        setPortalRoot(document.body);
    }, []);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                let token = await requestToken(); // Request FCM token on load
                console.log("FCM Token:", token);
            } catch (error) {
                console.error("Error fetching FCM token:", error);
            }
        };

        fetchToken(); // Call the async function

        const unsubscribe = onMessage(FirebaseMessaging, (payload) => {
            console.log("🔔 Foreground Notification:", payload);
            setNotification(buildNotificationMessage(payload));
            setShowNotification(true);

            const adminDiscountEvent = parseAdminDiscountEvent(payload);
            if (adminDiscountEvent) {
                window.dispatchEvent(
                    new CustomEvent("admin-discount-status", {
                        detail: adminDiscountEvent,
                    })
                );
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showNotification]);

    if (!showNotification || !portalRoot) return null;

    return createPortal(
        <div className="w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-violet-100 shadow-lg rounded-lg fixed bottom-4 right-2 sm:right-4 z-[99999] pointer-events-auto">
            <div className="flex items-center p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                <div>
                    <p className="text-sm font-medium text-black">{notification.title}</p>
                    <p className="text-sm text-gray-700">{notification.body}</p>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default FcmToast;
