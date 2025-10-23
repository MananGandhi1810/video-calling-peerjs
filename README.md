# Simplified P2P Video Call Website

A simple peer-to-peer video calling application built with WebRTC and PeerJS. This project enables direct video and audio communication between two users through their browsers.

## Features

- Peer-to-peer video and audio calls
- Toggle audio and video during calls
- Screen sharing support
- Real-time connection status indicator
- Simple and clean user interface
- No server required for signaling (uses PeerJS)

## Tech Stack

- HTML5 - Frontend interface
- Vanilla JavaScript - Client logic
- WebRTC - Peer-to-peer communication

## Usage

1. Open `index.html` in your browser

## How It Works

The application uses PeerJS to establish WebRTC connections between peers. Each user gets a unique Peer ID. To connect, one user provides the other user's ID, and the connection is established directly between their browsers without routing through a server.
