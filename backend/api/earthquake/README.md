Local earthquake API integration point.

The restored Live Earthquake Alerts module now reads static JSON directly from `/data/earthquake` and `/content/live-earthquake-alerts`.
This folder remains available for future local ingestion jobs without introducing external API dependencies.
