package websocket

import "github.com/gorilla/websocket"

// Data received from browser
type Data struct {
	Type      string      `json:"type"`
	Name      string      `json:"name"`
	Offer     interface{} `json:"offer"`
	Answer    interface{} `json:"answer"`
	Candidate interface{} `json:"candidate"`
}

// Message send back to browser
type Message struct {
	Type      string      `json:"type"`
	Name      string      `json:"name"`
	Success   bool        `json:"success"`
	Offer     interface{} `json:"offer"`
	Answer    interface{} `json:"answer"`
	Candidate interface{} `json:"candidate"`
}

// Connection information
type Connection struct {
	ws        *websocket.Conn
	name      string
	otherName string
}
