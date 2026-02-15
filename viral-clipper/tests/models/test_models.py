import pytest
from pydantic import ValidationError

from src.ai.moment_detector import ViralMoment
from src.ai.hook_writer import HookVariation


class TestViralMoment:
    def test_valid(self):
        m = ViralMoment(
            start_time=0.0,
            end_time=30.0,
            hook_text="Amazing hook",
            caption_text="Great caption #viral",
            viral_score=85,
            reasoning="Very engaging content",
        )
        assert m.viral_score == 85

    def test_score_too_high(self):
        with pytest.raises(ValidationError):
            ViralMoment(
                start_time=0.0,
                end_time=30.0,
                hook_text="hook",
                caption_text="cap",
                viral_score=101,
                reasoning="r",
            )

    def test_score_too_low(self):
        with pytest.raises(ValidationError):
            ViralMoment(
                start_time=0.0,
                end_time=30.0,
                hook_text="hook",
                caption_text="cap",
                viral_score=-1,
                reasoning="r",
            )

    def test_score_boundary_zero(self):
        m = ViralMoment(
            start_time=0.0,
            end_time=30.0,
            hook_text="hook",
            caption_text="cap",
            viral_score=0,
            reasoning="r",
        )
        assert m.viral_score == 0

    def test_score_boundary_hundred(self):
        m = ViralMoment(
            start_time=0.0,
            end_time=30.0,
            hook_text="hook",
            caption_text="cap",
            viral_score=100,
            reasoning="r",
        )
        assert m.viral_score == 100

    def test_missing_required_field(self):
        with pytest.raises(ValidationError):
            ViralMoment(
                start_time=0.0,
                end_time=30.0,
                hook_text="hook",
                # missing caption_text, viral_score, reasoning
            )


class TestHookVariation:
    def test_valid(self):
        h = HookVariation(
            hook_text="You won't believe this",
            post_caption="Amazing content #viral",
            hook_style="bold_claim",
        )
        assert h.hook_style == "bold_claim"

    def test_missing_field(self):
        with pytest.raises(ValidationError):
            HookVariation(
                hook_text="Missing fields",
                # missing post_caption and hook_style
            )
