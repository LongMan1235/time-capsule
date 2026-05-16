export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: object) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ to: expoPushToken, title, body, data })
  });

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.status}`);
  }
}
