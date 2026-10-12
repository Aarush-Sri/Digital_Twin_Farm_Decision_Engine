from typing import Dict
from .models import CropType, GrowthStage, CropState, SoilState, EnvironmentState


class CropAgronomicProfile:
    def __init__(
        self,
        base_temp_c: float,
        gdd_germination: float,
        gdd_vegetative: float,
        gdd_flowering: float,
        gdd_ripening: float,
        gdd_maturity: float,
        kc_initial: float,
        kc_mid: float,
        kc_end: float,
        optimal_ph: tuple[float, float],
        optimal_n: float,
        optimal_p: float,
        optimal_k: float,
        max_yield_kg_per_m2: float,
    ):
        self.base_temp_c = base_temp_c
        self.gdd_stages = {
            GrowthStage.GERMINATION: gdd_germination,
            GrowthStage.VEGETATIVE: gdd_vegetative,
            GrowthStage.FLOWERING: gdd_flowering,
            GrowthStage.RIPENING: gdd_ripening,
            GrowthStage.HARVEST_READY: gdd_maturity,
        }
        self.kc_stages = {
            GrowthStage.SEED: kc_initial,
            GrowthStage.GERMINATION: kc_initial,
            GrowthStage.VEGETATIVE: (kc_initial + kc_mid) / 2,
            GrowthStage.FLOWERING: kc_mid,
            GrowthStage.RIPENING: (kc_mid + kc_end) / 2,
            GrowthStage.HARVEST_READY: kc_end,
            GrowthStage.DEAD: 0.0,
        }
        self.optimal_ph = optimal_ph
        self.optimal_n = optimal_n
        self.optimal_p = optimal_p
        self.optimal_k = optimal_k
        self.max_yield_kg = max_yield_kg_per_m2


CROP_DATABASE: Dict[CropType, CropAgronomicProfile] = {
    CropType.TOMATO: CropAgronomicProfile(
        base_temp_c=10.0,
        gdd_germination=35.0,
        gdd_vegetative=200.0,
        gdd_flowering=500.0,
        gdd_ripening=900.0,
        gdd_maturity=1200.0,
        kc_initial=0.45,
        kc_mid=1.15,
        kc_end=0.80,
        optimal_ph=(6.0, 6.8),
        optimal_n=150.0,
        optimal_p=60.0,
        optimal_k=180.0,
        max_yield_kg_per_m2=6.5,
    ),
    CropType.CORN: CropAgronomicProfile(
        base_temp_c=10.0,
        gdd_germination=30.0,
        gdd_vegetative=250.0,
        gdd_flowering=600.0,
        gdd_ripening=1000.0,
        gdd_maturity=1400.0,
        kc_initial=0.30,
        kc_mid=1.20,
        kc_end=0.60,
        optimal_ph=(5.8, 7.0),
        optimal_n=180.0,
        optimal_p=70.0,
        optimal_k=160.0,
        max_yield_kg_per_m2=8.0,
    ),
    CropType.WHEAT: CropAgronomicProfile(
        base_temp_c=4.0,
        gdd_germination=25.0,
        gdd_vegetative=180.0,
        gdd_flowering=450.0,
        gdd_ripening=800.0,
        gdd_maturity=1100.0,
        kc_initial=0.35,
        kc_mid=1.10,
        kc_end=0.40,
        optimal_ph=(6.0, 7.5),
        optimal_n=120.0,
        optimal_p=50.0,
        optimal_k=130.0,
        max_yield_kg_per_m2=4.5,
    ),
    CropType.SOYBEAN: CropAgronomicProfile(
        base_temp_c=10.0,
        gdd_germination=25.0,
        gdd_vegetative=160.0,
        gdd_flowering=400.0,
        gdd_ripening=750.0,
        gdd_maturity=1050.0,
        kc_initial=0.40,
        kc_mid=1.15,
        kc_end=0.50,
        optimal_ph=(6.0, 7.0),
        optimal_n=90.0,
        optimal_p=45.0,
        optimal_k=140.0,
        max_yield_kg_per_m2=3.8,
    ),
    CropType.LETTUCE: CropAgronomicProfile(
        base_temp_c=4.0,
        gdd_germination=20.0,
        gdd_vegetative=100.0,
        gdd_flowering=200.0,
        gdd_ripening=280.0,
        gdd_maturity=350.0,
        kc_initial=0.50,
        kc_mid=1.00,
        kc_end=0.90,
        optimal_ph=(6.0, 7.0),
        optimal_n=100.0,
        optimal_p=40.0,
        optimal_k=120.0,
        max_yield_kg_per_m2=3.0,
    ),
    CropType.POTATO: CropAgronomicProfile(
        base_temp_c=7.0,
        gdd_germination=35.0,
        gdd_vegetative=200.0,
        gdd_flowering=480.0,
        gdd_ripening=850.0,
        gdd_maturity=1150.0,
        kc_initial=0.50,
        kc_mid=1.15,
        kc_end=0.75,
        optimal_ph=(5.2, 6.5),
        optimal_n=140.0,
        optimal_p=60.0,
        optimal_k=200.0,
        max_yield_kg_per_m2=7.2,
    ),
    CropType.CARROT: CropAgronomicProfile(
        base_temp_c=4.5,
        gdd_germination=30.0,
        gdd_vegetative=160.0,
        gdd_flowering=380.0,
        gdd_ripening=650.0,
        gdd_maturity=900.0,
        kc_initial=0.45,
        kc_mid=1.05,
        kc_end=0.85,
        optimal_ph=(6.0, 6.8),
        optimal_n=110.0,
        optimal_p=55.0,
        optimal_k=150.0,
        max_yield_kg_per_m2=4.0,
    ),
    CropType.COTTON: CropAgronomicProfile(
        base_temp_c=15.0,
        gdd_germination=45.0,
        gdd_vegetative=300.0,
        gdd_flowering=700.0,
        gdd_ripening=1100.0,
        gdd_maturity=1500.0,
        kc_initial=0.35,
        kc_mid=1.20,
        kc_end=0.65,
        optimal_ph=(5.8, 7.5),
        optimal_n=160.0,
        optimal_p=60.0,
        optimal_k=170.0,
        max_yield_kg_per_m2=3.2,
    ),
    CropType.PUMPKIN: CropAgronomicProfile(
        base_temp_c=12.0,
        gdd_germination=40.0,
        gdd_vegetative=240.0,
        gdd_flowering=520.0,
        gdd_ripening=920.0,
        gdd_maturity=1250.0,
        kc_initial=0.45,
        kc_mid=1.00,
        kc_end=0.80,
        optimal_ph=(6.0, 6.8),
        optimal_n=130.0,
        optimal_p=65.0,
        optimal_k=180.0,
        max_yield_kg_per_m2=7.8,
    ),
    CropType.STRAWBERRY: CropAgronomicProfile(
        base_temp_c=8.0,
        gdd_germination=20.0,
        gdd_vegetative=120.0,
        gdd_flowering=280.0,
        gdd_ripening=450.0,
        gdd_maturity=600.0,
        kc_initial=0.40,
        kc_mid=0.85,
        kc_end=0.75,
        optimal_ph=(5.5, 6.5),
        optimal_n=95.0,
        optimal_p=40.0,
        optimal_k=130.0,
        max_yield_kg_per_m2=3.5,
    ),
}



class CropGrowthEngine:
    """Calculates daily crop phenology, growing degree days, environmental stress, and yield."""

    @staticmethod
    def step_crop(
        crop: CropState,
        soil: SoilState,
        env: EnvironmentState
    ) -> tuple[CropState, SoilState]:
        """Advances crop by 1 day based on temperature, soil moisture, and nutrients."""
        if crop.current_stage == GrowthStage.DEAD:
            return crop, soil

        profile = CROP_DATABASE.get(crop.crop_type, CROP_DATABASE[CropType.TOMATO])

        # 1. Calculate Growing Degree Days (GDD)
        daily_gdd = max(0.0, env.temp_avg_c - profile.base_temp_c)
        crop.gdd_accumulated += daily_gdd
        crop.age_days += 1

        # 2. Determine Growth Stage
        if crop.gdd_accumulated >= profile.gdd_stages[GrowthStage.HARVEST_READY]:
            crop.current_stage = GrowthStage.HARVEST_READY
        elif crop.gdd_accumulated >= profile.gdd_stages[GrowthStage.RIPENING]:
            crop.current_stage = GrowthStage.RIPENING
        elif crop.gdd_accumulated >= profile.gdd_stages[GrowthStage.FLOWERING]:
            crop.current_stage = GrowthStage.FLOWERING
        elif crop.gdd_accumulated >= profile.gdd_stages[GrowthStage.VEGETATIVE]:
            crop.current_stage = GrowthStage.VEGETATIVE
        elif crop.gdd_accumulated >= profile.gdd_stages[GrowthStage.GERMINATION]:
            crop.current_stage = GrowthStage.GERMINATION
        else:
            crop.current_stage = GrowthStage.SEED

        # 3. Calculate Water Demand & Stress
        if soil.moisture_pct <= soil.wilting_point_pct:
            water_stress = 100.0
        elif soil.moisture_pct < 45.0:
            water_stress = ((45.0 - soil.moisture_pct) / (45.0 - soil.wilting_point_pct)) * 100.0
        elif soil.moisture_pct > 88.0:
            water_stress = min(100.0, ((soil.moisture_pct - 88.0) / 12.0) * 100.0)
        else:
            water_stress = 0.0

        crop.water_stress_pct = round(water_stress, 1)

        # 4. Nutrient Stress Calculation
        n_ratio = min(1.0, soil.nitrogen_ppm / max(1.0, profile.optimal_n))
        p_ratio = min(1.0, soil.phosphorus_ppm / max(1.0, profile.optimal_p))
        k_ratio = min(1.0, soil.potassium_ppm / max(1.0, profile.optimal_k))
        nutrient_availability = (n_ratio * 0.5) + (p_ratio * 0.25) + (k_ratio * 0.25)

        ph_min, ph_max = profile.optimal_ph
        if soil.ph < ph_min:
            ph_penalty = min(0.5, (ph_min - soil.ph) * 0.3)
        elif soil.ph > ph_max:
            ph_penalty = min(0.5, (soil.ph - ph_max) * 0.3)
        else:
            ph_penalty = 0.0

        nutrient_stress = max(0.0, min(100.0, (1.0 - (nutrient_availability - ph_penalty)) * 100.0))
        crop.nutrient_stress_pct = round(nutrient_stress, 1)

        # 5. Health & Biomass Accumulation
        combined_stress = (crop.water_stress_pct * 0.65) + (crop.nutrient_stress_pct * 0.35)
        if combined_stress > 60.0:
            health_delta = -((combined_stress - 60.0) * 0.2)
        elif combined_stress < 20.0:
            health_delta = +1.5
        else:
            health_delta = -0.5

        crop.health_pct = max(0.0, min(100.0, round(crop.health_pct + health_delta, 1)))

        if crop.health_pct <= 5.0:
            crop.current_stage = GrowthStage.DEAD

        growth_multiplier = (crop.health_pct / 100.0) * (1.0 - (combined_stress / 100.0))
        solar_energy_factor = min(1.5, env.solar_radiation_wm2 / 400.0)
        daily_biomass_gain = max(0.2, (daily_gdd * 0.8) * growth_multiplier * solar_energy_factor)
        crop.biomass_grams = round(crop.biomass_grams + daily_biomass_gain, 1)

        # 6. Projected Yield Calculation
        stage_completion = min(1.0, crop.gdd_accumulated / max(1.0, profile.gdd_stages[GrowthStage.HARVEST_READY]))
        yield_potential = profile.max_yield_kg * (crop.health_pct / 100.0) * (crop.biomass_grams / max(10.0, crop.biomass_grams + 50.0))
        crop.projected_yield_kg = round(yield_potential * stage_completion, 2)

        # 7. Soil Nutrient Uptake
        soil.nitrogen_ppm = max(5.0, soil.nitrogen_ppm - (0.4 * growth_multiplier))
        soil.phosphorus_ppm = max(2.0, soil.phosphorus_ppm - (0.15 * growth_multiplier))
        soil.potassium_ppm = max(5.0, soil.potassium_ppm - (0.3 * growth_multiplier))

        return crop, soil
