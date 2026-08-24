package com.resilience360.mobile;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Shows earthquake FCM messages while the app is in the foreground.
 * Background/killed delivery of notification payloads is handled by the system
 * once POST_NOTIFICATIONS is granted.
 */
public class EarthquakeFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage message) {
        RemoteMessage.Notification notification = message.getNotification();
        if (notification != null) {
            EarthquakeNotificationHelper.post(
                    this,
                    notification.getTitle(),
                    notification.getBody(),
                    message.getMessageId());
            return;
        }
        Map<String, String> data = message.getData();
        if (data == null || data.isEmpty()) {
            return;
        }
        String title = data.containsKey("title") ? data.get("title") : "Earthquake alert";
        String body = data.containsKey("body") ? data.get("body") : data.get("place");
        String eventId = data.containsKey("eventId") ? data.get("eventId") : message.getMessageId();
        EarthquakeNotificationHelper.post(this, title, body, eventId);
    }
}
