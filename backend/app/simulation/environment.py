import math
import random
from typing import Optional
from .models import EnvironmentState


class EnvironmentEngine:
    """Calculates daily solar radiation, diurnal cycle, temperature, and reference evapotranspiration."""

    def __init__(self, latitude_deg: float = 35.0, seed: Optional[int] = 42):
        self.latitude_deg = latitude_deg
        self.latitude_rad = math.radians(latitude_deg)
        if seed is not None:
            random.seed(seed)

    def calculate_day_environment(
        self,
        day: int,
        weather_override: Optional[dict] = None
    ) -> EnvironmentState:
        """Computes daily solar cycle, thermal profile, and ET0 for day-of-year."""
        doy = (day % 365) + 1

        # 1. Solar declination angle delta (Cooper 1969)
        declination_rad = math.radians(23.45) * math.sin(math.radians((360 / 365) * (doy - 81)))

        # 2. Sunset hour angle omega_s
        cos_omega_s = -math.tan(self.latitude_rad) * math.tan(declination_rad)
        cos_omega_s = max(-1.0, min(1.0, cos_omega_s))
        omega_s_rad = math.acos(cos_omega_s)
        sunlight_hours = (24.0 / math.pi) * omega_s_rad

        # 3. Solar noon elevation angle
        solar_noon_elevation_deg = 90.0 - self.latitude_deg + math.degrees(declination_rad)
        solar_noon_elevation_deg = max(5.0, min(90.0, solar_noon_elevation_deg))

        # 4. Extraterrestrial Radiation (Ra in MJ/m^2/day)
        dr = 1.0 + 0.033 * math.cos(2 * math.pi * doy / 365)
        ra_mj = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
            omega_s_rad * math.sin(self.latitude_rad) * math.sin(declination_rad) +
            math.cos(self.latitude_rad) * math.cos(declination_rad) * math.sin(omega_s_rad)
        )
        ra_mj = max(5.0, ra_mj)

        # 5. Stochastic cloud cover & rainfall patterns
        cloud_factor = random.uniform(0.1, 0.4)
        rain_chance = random.random()
        rainfall_mm = 0.0
        if rain_chance < 0.18:
            rainfall_mm = round(random.uniform(2.0, 18.0), 1)
            cloud_factor = random.uniform(0.7, 0.95)

        cloud_cover_pct = round(cloud_factor * 100, 1)

        # 6. Solar Irradiance at Earth surface (W/m^2)
        as_const = 0.25
        bs_const = 0.50
        sun_ratio = max(0.1, 1.0 - cloud_factor)
        rs_mj = (as_const + bs_const * sun_ratio) * ra_mj
        solar_radiation_wm2 = round((rs_mj * 1_000_000) / (sunlight_hours * 3600), 1)

        # 7. Diurnal Temperature Curve
        seasonal_temp_base = 22.0 + 8.0 * math.sin(math.radians((360 / 365) * (doy - 110)))
        temp_variation = random.uniform(-2.5, 2.5)
        temp_avg_c = seasonal_temp_base + temp_variation - (cloud_factor * 2.0)
        diurnal_range = 10.0 * (1.0 - 0.5 * cloud_factor)
        temp_min_c = round(temp_avg_c - (diurnal_range / 2), 1)
        temp_max_c = round(temp_avg_c + (diurnal_range / 2), 1)
        temp_avg_c = round((temp_min_c + temp_max_c) / 2, 1)

        # 8. Reference Evapotranspiration ET0 (FAO Hargreaves-Samani method)
        ra_mm = 0.408 * ra_mj
        temp_diff = max(1.0, temp_max_c - temp_min_c)
        et0_mm = 0.0023 * (temp_avg_c + 17.8) * math.sqrt(temp_diff) * ra_mm
        et0_mm = max(0.5, round(et0_mm, 2))

        # Humidity & wind
        humidity_pct = round(min(98.0, max(25.0, 60.0 + (rainfall_mm * 2) - (temp_avg_c * 0.5))), 1)
        wind_speed_ms = round(random.uniform(1.2, 4.5), 1)

        # Apply overrides if provided
        if weather_override:
            if "temp_avg_c" in weather_override:
                temp_avg_c = weather_override["temp_avg_c"]
            if "rainfall_mm" in weather_override:
                rainfall_mm = weather_override["rainfall_mm"]
            if "solar_radiation_wm2" in weather_override:
                solar_radiation_wm2 = weather_override["solar_radiation_wm2"]
            if "cloud_cover_pct" in weather_override:
                cloud_cover_pct = weather_override["cloud_cover_pct"]
            if "et0_mm" in weather_override:
                et0_mm = weather_override["et0_mm"]

        return EnvironmentState(
            day=day,
            solar_radiation_wm2=solar_radiation_wm2,
            sunlight_hours=round(sunlight_hours, 2),
            solar_noon_elevation_deg=round(solar_noon_elevation_deg, 1),
            cloud_cover_pct=cloud_cover_pct,
            temp_min_c=temp_min_c,
            temp_max_c=temp_max_c,
            temp_avg_c=temp_avg_c,
            rainfall_mm=rainfall_mm,
            humidity_pct=humidity_pct,
            wind_speed_ms=wind_speed_ms,
            et0_mm=et0_mm,
        )
