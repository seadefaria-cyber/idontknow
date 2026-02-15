from datetime import datetime, timezone
from unittest.mock import MagicMock

from src.distribution.scheduler import PostScheduler, POSTS_PER_ACCOUNT_PER_DAY


def _make_account(id_=1):
    account = MagicMock()
    account.id = id_
    return account


class TestGenerateTimeSlots:
    def test_no_accounts(self):
        scheduler = PostScheduler()
        result = scheduler._generate_time_slots([], datetime(2024, 1, 15))
        assert result == []

    def test_one_account(self):
        scheduler = PostScheduler()
        account = _make_account()
        result = scheduler._generate_time_slots([account], datetime(2024, 1, 15))
        assert len(result) == POSTS_PER_ACCOUNT_PER_DAY
        for acct, time in result:
            assert acct == account

    def test_multiple_accounts(self):
        scheduler = PostScheduler()
        accounts = [_make_account(i) for i in range(3)]
        result = scheduler._generate_time_slots(accounts, datetime(2024, 1, 15))
        assert len(result) == 3 * POSTS_PER_ACCOUNT_PER_DAY

    def test_times_on_target_date(self):
        scheduler = PostScheduler()
        account = _make_account()
        target = datetime(2024, 6, 15)
        result = scheduler._generate_time_slots([account], target)
        for _, time in result:
            assert time.year == 2024
            assert time.month == 6
            assert time.day == 15
            assert time.tzinfo == timezone.utc
