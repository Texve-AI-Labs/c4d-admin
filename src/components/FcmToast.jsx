import React, { useState, useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { FirebaseMessaging, requestToken } from "@/configs/firebaseConfig";
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // Import Heroicons

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

    if (!showNotification) return null;

    return (
        <div className="w-72 bg-violet-100 shadow-lg rounded-lg absolute top-5 end-5 z-50">
            <div className="flex items-center p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                <div>
                    <p className="text-sm font-medium text-black">{notification.title}</p>
                    <p className="text-sm text-gray-700">{notification.body}</p>
                </div>
            </div>
        </div>
    );
};

export default FcmToast;
