from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes_farm import router as farm_router
from .api.routes_simulation import router as simulation_router
from .api.routes_agent import router as agent_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Agriculture Simulation Backend. Orchestrates virtual farm dynamics, "
        "crop phenology, daily solar cycles, sandbox 'what-if' comparisons, and autonomous AI agents."
    ),
)

# CORS middleware for any frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(farm_router)
app.include_router(simulation_router)
app.include_router(agent_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
