package http

import (
	"net/http"
	websocket "webrtc-app/signaling/pkg/service"

	"github.com/gorilla/mux"
)

// RunApp runs the app in main.go
func RunApp(port string) {
	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ws := websocket.NewConnection(w, r)
		go ws.HandleMessageLoop()
	})
	http.ListenAndServe(":"+port, r)
}
