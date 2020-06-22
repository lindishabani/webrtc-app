package websocket

import "github.com/gorilla/websocket"

// Data received from browser
type data struct {
	Type      string      `json:"type"`
	Name      string      `json:"name"`
	Offer     interface{} `json:"offer"`
	Answer    interface{} `json:"answer"`
	Candidate interface{} `json:"candidate"`
}

// Message send back to browser
type message struct {
	Type      string      `json:"type"`
	Name      string      `json:"name"`
	Success   bool        `json:"success"`
	Offer     interface{} `json:"offer"`
	Answer    interface{} `json:"answer"`
	Candidate interface{} `json:"candidate"`
}

// Connection information
type connection struct {
	ws        *websocket.Conn
	name      string
	otherName string
}
