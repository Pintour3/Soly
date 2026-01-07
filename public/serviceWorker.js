// service-worker.js
self.addEventListener('push', (event) => {
    const data = event.data.json()
    
    event.waitUntil((async ()=>{
        if ("setAppBadge" in self.navigator) {
            try {
                const currentBadge = await self.navigator.getBadge() || 0
                await self.navigator.setAppBadge(currentBadge + 1)

            } catch (e) {
                console.error("error ", e)
            }
        }
    }))

    const options = {
        body: data.body,
        icon: data.icon || '/public/assets/png/soly_dark_ISO_border.png',
        badge: '/public/assets/favicons/favicon-96x96.png',
        vibrate: [200, 100, 200],
        data: data.data,
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()   
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        )
    }
})