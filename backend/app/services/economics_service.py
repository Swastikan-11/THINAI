from typing import Dict, Any

def calculate_farm_economics(
    crop: str = "Paddy (Rice)",
    area_acres: float = 2.0,
    seed_cost_acre: float = 1200.0,
    fertilizer_cost_acre: float = 3400.0,
    pesticide_cost_acre: float = 1800.0,
    labour_cost_acre: float = 6500.0,
    irrigation_cost_acre: float = 2200.0,
    machinery_cost_acre: float = 2800.0,
    other_expenses_acre: float = 1100.0,
    expected_yield_q_acre: float = 24.0,
    expected_price_rs_q: float = 2840.0
) -> Dict[str, Any]:
    """
    Computes rigorous farm cultivation economics, break-even analysis,
    and downside scenario projection per Phase 15 specification.
    """
    cost_per_acre = (
        seed_cost_acre + fertilizer_cost_acre + pesticide_cost_acre +
        labour_cost_acre + irrigation_cost_acre + machinery_cost_acre + other_expenses_acre
    )
    total_cost = cost_per_acre * area_acres

    expected_revenue_per_acre = expected_yield_q_acre * expected_price_rs_q
    total_revenue = expected_revenue_per_acre * area_acres

    net_profit_per_acre = expected_revenue_per_acre - cost_per_acre
    total_net_profit = net_profit_per_acre * area_acres

    # Break-even modal price (Rs per quintal)
    break_even_price = cost_per_acre / max(1.0, expected_yield_q_acre)

    # Downside stress scenario: Yield -15% & Market Price -10%
    downside_yield = expected_yield_q_acre * 0.85
    downside_price = expected_price_rs_q * 0.90
    downside_revenue = downside_yield * downside_price
    downside_profit_per_acre = downside_revenue - cost_per_acre

    # Profit range
    profit_min_acre = round(downside_profit_per_acre, 2)
    profit_max_acre = round(net_profit_per_acre * 1.15, 2)

    return {
        "crop": crop,
        "area_acres": area_acres,
        "cost_breakdown_per_acre": {
            "seed_cost": seed_cost_acre,
            "fertilizer_cost": fertilizer_cost_acre,
            "pesticide_cost": pesticide_cost_acre,
            "labour_cost": labour_cost_acre,
            "irrigation_cost": irrigation_cost_acre,
            "machinery_cost": machinery_cost_acre,
            "other_expenses": other_expenses_acre
        },
        "total_cost_per_acre": round(cost_per_acre, 2),
        "total_farm_cultivation_cost": round(total_cost, 2),
        "expected_revenue_per_acre": round(expected_revenue_per_acre, 2),
        "total_expected_revenue": round(total_revenue, 2),
        "net_profit_per_acre": round(net_profit_per_acre, 2),
        "total_net_profit": round(total_net_profit, 2),
        "break_even_price_per_quintal": round(break_even_price, 2),
        "downside_scenario_profit_per_acre": round(downside_profit_per_acre, 2),
        "expected_profit_range_acre": {
            "min_downside": profit_min_acre,
            "expected_baseline": round(net_profit_per_acre, 2),
            "max_upside": profit_max_acre
        },
        "benefit_cost_ratio": round(expected_revenue_per_acre / max(1.0, cost_per_acre), 2)
    }
