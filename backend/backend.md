# Backend — Digital Farmland Twin Decision Engine

## Tech Stack

* **Language:** Python 3.11+
* **Backend:** Flask REST API
* **AI:** Ollama (local LLM) or hosted LLM API
* **Database:** SQLite
* **Simulation:** Custom Python farm simulation engine
* **Orchestration:** Custom Python code 

## Architecture

React/Vite UI → Flask API → Python AI Orchestrator ↔ LLM

The orchestrator interacts with:

* **Simulation Engine:** Updates virtual farm parameters and calculates outcomes.
* **Farm Data Manager:** Retrieves and updates farm layouts, soil, crops, and irrigation.
* **Agricultural Data Provider:** Supplies weather, soil, and crop data.
* **SQLite:** Stores farm configurations, simulation results, and history.

## Core AI Workflow

1. Receive the user's objective from the frontend.
2. Load the current virtual farm state.
3. Give the AI the farm context and available simulation tools.
4. Let the AI choose actions and propose parameter changes.
5. Validate each action and execute it in Python.
6. Return simulation results to the AI.
7. Let the AI compare scenarios and experiment again within a fixed limit.
8. Return recommendations, numerical comparisons, and trade-offs to the UI.

## API Endpoints

* `GET /api/health`
* `POST /api/farms`
* `GET /api/farms/<farm_id>`
* `PUT /api/farms/<farm_id>`
* `POST /api/farms/<farm_id>/simulate`
* `POST /api/farms/<farm_id>/analyze`
* `GET /api/simulations/<simulation_id>`

## Requirements

* Keep AI orchestration and simulation logic in separate modules.
* Allow the AI to control the simulation through validated tools, never arbitrary code execution.
* Make simulation results reproducible and distinguish estimates from measured data.
* Include sample farm data so the prototype works without external APIs.
* Validate inputs, handle errors, and limit AI tool calls.
* Configure the LLM through environment variables.
* Include `requirements.txt`, `.env.example`, `README.md`, and basic tests.
* Support Windows PowerShell development.

## Initial Milestone

Build a working Flask backend, farm state model, SQLite storage, and basic simulation first. Then implement the AI agent loop that changes farm parameters, runs simulations, evaluates outcomes, and returns recommendations.

Create actual working files in the current workspace. Do not build the frontend yet.
