"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";

const tokenStorageKey = "firebase_messaging_token";

function firebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDJ-fpg9UgdrkSIw0ojPuG_2KTyc9eK1Jk",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hoantienmuahang-b9840.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hoantienmuahang-b9840",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hoantienmuahang-b9840.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "885283558978",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:885283558978:web:7bb4665b5010bbd533bfdb"
  };
}

function vapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BMRjrs-6eMVxUAFB7RwtFlep7ZhhX8h3jPmF7KG0sV-5tp-J95v3i1uauORvIWeBexJY8PPAt7PDHXm__SWDa2M";
}

export function isFirebaseMessagingConfigured() {
  const config = firebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId && vapidKey());
}

function serviceWorkerUrl() {
  const config = firebaseConfig();
  const params = new URLSearchParams({
    apiKey: config.apiKey ?? "",
    authDomain: config.authDomain ?? "",
    projectId: config.projectId ?? "",
    storageBucket: config.storageBucket ?? "",
    messagingSenderId: config.messagingSenderId ?? "",
    appId: config.appId ?? ""
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export async function registerForPushNotifications() {
  if (!isFirebaseMessagingConfigured()) throw new Error("Firebase Web Push chưa được cấu hình.");
  if (!(await isSupported())) throw new Error("Trình duyệt này chưa hỗ trợ thông báo đẩy.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép nhận thông báo.");

  const registration = await navigator.serviceWorker.register(serviceWorkerUrl());
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig());
  const token = await getToken(getMessaging(app), {
    vapidKey: vapidKey(),
    serviceWorkerRegistration: registration
  });
  if (!token) throw new Error("Firebase chưa cấp token cho thiết bị.");
  window.localStorage.setItem(tokenStorageKey, token);
  return token;
}

export async function unregisterFromPushNotifications() {
  const storedToken = window.localStorage.getItem(tokenStorageKey);
  if (!storedToken) return null;

  if (isFirebaseMessagingConfigured() && (await isSupported())) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig());
    await deleteToken(getMessaging(app)).catch(() => false);
  }
  window.localStorage.removeItem(tokenStorageKey);
  return storedToken;
}

export function getStoredPushToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(tokenStorageKey);
}
