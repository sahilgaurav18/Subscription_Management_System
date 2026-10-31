from abc import ABC, abstractmethod


class DiscountStrategy(ABC):
    """Abstract Strategy interface for calculating discount savings."""

    @abstractmethod
    def calculate_saving(self, amount: int, value: int) -> int:
        """
        Calculates savings in integer minor units.
        :param amount: Eligible purchase subtotal in minor units
        :param value: Discount value (minor units for fixed, percent for percentage)
        """
        pass


class FixedDiscountStrategy(DiscountStrategy):
    """Fixed amount discount strategy (e.g. $15.00 off)."""

    def calculate_saving(self, amount: int, value: int) -> int:
        return max(0, min(amount, value))


class PercentDiscountStrategy(DiscountStrategy):
    """Percentage discount strategy (e.g. 20% off)."""

    def calculate_saving(self, amount: int, value: int) -> int:
        if value <= 0 or amount <= 0:
            return 0
        return max(0, int(round(amount * (float(value) / 100.0))))


class DiscountStrategyContext:
    """Factory and registry for discount strategies."""
    _strategies = {
        "fixed": FixedDiscountStrategy(),
        "percent": PercentDiscountStrategy(),
    }

    @classmethod
    def get_strategy(cls, discount_type: str) -> DiscountStrategy:
        strategy = cls._strategies.get(discount_type.lower().strip())
        if not strategy:
            raise ValueError(f"Unsupported discount strategy type: {discount_type}")
        return strategy

