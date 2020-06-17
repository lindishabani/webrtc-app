package websocket

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

// Users contains every connected user to websocket
var Users = make(map[string]*Connection)

// WsConnection ...
type WsConnection interface {
	HandleMessageLoop()
	readMessage() int
	sendMessage(conn *websocket.Conn, msgType int, message *Message)
}

// WS ...
type WS struct {
	conn    *websocket.Conn
	message *Message
	data    *Data
}

// NewConnection starts a new Websocket
func NewConnection(w http.ResponseWriter, r *http.Request) WsConnection {
	var (
		conn     *websocket.Conn
		err      error
		upgrader = websocket.Upgrader{ // Websocket configurations
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		}
	)

	conn, err = upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Webscket error: ", err)
	}

	return &WS{
		conn: conn,
	}
}

// HandleMessageLoop handels messages
func (w *WS) HandleMessageLoop() {
	for {
		// Read message from browser
		msgType := w.readMessage()
		switch w.data.Type {
		case "login":
			if userLoggedIn(w.data.Name, Users) {
				fmt.Println("User ", w.data.Name, "is already logged in!")
				w.sendMessage(w.conn, msgType, &Message{
					Type:    "login",
					Success: false,
				})
			} else {
				fmt.Println("User logged in as:", w.data.Name)
				Users[w.data.Name] = &Connection{
					ws:   w.conn,
					name: w.data.Name,
				}
				w.sendMessage(w.conn, msgType, &Message{
					Type:    "login",
					Success: true,
				})
			}
		case "offer":
			// TODO: rewrite this part
			var name string
			for k := range Users {
				if k == w.data.Name {
					continue
				} else {
					name = k
				}
			}
			////////
			fmt.Println("Sending offer to", w.data.Name)
			if userConnection, ok := Users[w.data.Name]; ok {
				Users[w.data.Name].otherName = w.data.Name
				w.sendMessage(userConnection.ws, msgType, &Message{
					Type:  "offer",
					Offer: w.data.Offer,
					Name:  name,
				})
			}
		case "answer":
			fmt.Println("Sending answer to", w.data.Name)
			if userConnection, ok := Users[w.data.Name]; ok {
				Users[w.data.Name].otherName = w.data.Name
				w.sendMessage(userConnection.ws, msgType, &Message{
					Type:   "answer",
					Answer: w.data.Answer,
				})
			}
		case "candidate":
			fmt.Println("Sending ICE to", w.data.Name)
			if userConnection, ok := Users[w.data.Name]; ok {
				w.sendMessage(userConnection.ws, msgType, &Message{
					Type:      "candidate",
					Candidate: w.data.Candidate,
				})
			}
		case "leave":
			fmt.Println("Disconnceting user from ", w.data.Name)
			w.sendMessage(w.conn, msgType, &Message{
				Type: "leave",
			})
		default:
			fmt.Println("Unknown message type: ", w.data.Type)
		}
	}
}

func (w *WS) readMessage() int {
	msgType, msg, err := w.conn.ReadMessage()
	if err != nil {
		fmt.Println("error Reading message: ", err)
	}

	err = json.Unmarshal(msg, &w.data)
	if err != nil {
		fmt.Println("Error parsing message: ", err)
	}
	return msgType
}

func (w *WS) sendMessage(conn *websocket.Conn, msgType int, message *Message) {
	ByteMessage := new(bytes.Buffer)
	json.NewEncoder(ByteMessage).Encode(message)
	conn.WriteMessage(msgType, ByteMessage.Bytes())
}

func userLoggedIn(name string, users map[string]*Connection) bool {
	if _, ok := users[name]; ok {
		return true
	}
	return false
}
