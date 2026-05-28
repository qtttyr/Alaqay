self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = new URL(event.notification.data?.url || "/brush", self.location.origin).href

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window",
    })

    const existingClient = windowClients.find((client) => {
      const clientUrl = new URL(client.url)
      return clientUrl.origin === self.location.origin
    })

    if (existingClient) {
      await existingClient.navigate(targetUrl)
      return existingClient.focus()
    }

    return self.clients.openWindow(targetUrl)
  })())
})
