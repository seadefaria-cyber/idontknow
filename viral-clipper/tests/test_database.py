from datetime import datetime, timezone

from src.models.client import Client, Source, SourceStatus
from src.models.content import ClipMoment, GeneratedClip, MomentStatus
from src.models.distribution import (
    Account,
    AccountStatus,
    PlatformType,
    PostJob,
    PostStatus,
)


class TestDatabaseModels:
    def test_create_client(self, db_session):
        client = Client(name="Test Client")
        db_session.add(client)
        db_session.flush()

        loaded = db_session.query(Client).first()
        assert loaded.name == "Test Client"
        assert loaded.id is not None

    def test_create_source(self, db_session):
        client = Client(name="Test")
        db_session.add(client)
        db_session.flush()

        source = Source(
            client_id=client.id,
            url="https://youtube.com/watch?v=test",
            file_path="/tmp/test.mp4",
            title="Test Video",
            duration_seconds=120.0,
            status=SourceStatus.PENDING,
        )
        db_session.add(source)
        db_session.flush()

        loaded = db_session.query(Source).first()
        assert loaded.title == "Test Video"
        assert loaded.status == SourceStatus.PENDING

    def test_full_chain(self, db_session):
        # Client -> Source -> Moment -> Clip -> Account -> PostJob
        client = Client(name="Full Chain")
        db_session.add(client)
        db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Source",
            duration_seconds=300.0,
            status=SourceStatus.READY,
        )
        db_session.add(source)
        db_session.flush()

        moment = ClipMoment(
            source_id=source.id,
            client_id=client.id,
            start_time=10.0,
            end_time=40.0,
            viral_score=85,
            hook_text="Hook",
            caption_text="Caption",
            reasoning="Reasoning",
            status=MomentStatus.READY,
        )
        db_session.add(moment)
        db_session.flush()

        clip = GeneratedClip(
            moment_id=moment.id,
            client_id=client.id,
            file_path="/tmp/clip.mp4",
            duration=30.0,
            caption_style="word_highlight",
            hook_type="text_overlay",
            quality_check_passed=True,
        )
        db_session.add(clip)
        db_session.flush()

        account = Account(
            client_id=client.id,
            platform=PlatformType.TIKTOK,
            username="testuser",
            credentials_encrypted="encrypted_data",
            status=AccountStatus.ACTIVE,
        )
        db_session.add(account)
        db_session.flush()

        job = PostJob(
            clip_id=clip.id,
            account_id=account.id,
            scheduled_at=datetime.now(timezone.utc),
            status=PostStatus.QUEUED,
            post_caption="Test caption",
            hashtags="#test",
        )
        db_session.add(job)
        db_session.flush()

        assert job.id is not None
        assert job.clip_id == clip.id
        assert job.account_id == account.id

    def test_client_sources_relationship(self, db_session):
        client = Client(name="Rel Test")
        db_session.add(client)
        db_session.flush()

        for i in range(3):
            source = Source(
                client_id=client.id,
                file_path=f"/tmp/test{i}.mp4",
                title=f"Video {i}",
                duration_seconds=60.0,
                status=SourceStatus.PENDING,
            )
            db_session.add(source)

        db_session.flush()
        db_session.refresh(client)

        assert len(client.sources) == 3

    def test_source_moments_relationship(self, db_session):
        client = Client(name="Moments Test")
        db_session.add(client)
        db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Source",
            duration_seconds=300.0,
            status=SourceStatus.READY,
        )
        db_session.add(source)
        db_session.flush()

        for i in range(2):
            moment = ClipMoment(
                source_id=source.id,
                client_id=client.id,
                start_time=i * 30.0,
                end_time=(i + 1) * 30.0,
                viral_score=80 - i * 10,
                hook_text=f"Hook {i}",
                caption_text=f"Caption {i}",
                reasoning=f"Reason {i}",
            )
            db_session.add(moment)

        db_session.flush()
        db_session.refresh(source)

        assert len(source.moments) == 2

    def test_enum_roundtrip(self, db_session):
        client = Client(name="Enum Test")
        db_session.add(client)
        db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Enum",
            duration_seconds=60.0,
            status=SourceStatus.TRANSCRIBING,
        )
        db_session.add(source)
        db_session.flush()

        loaded = db_session.query(Source).first()
        assert loaded.status == SourceStatus.TRANSCRIBING
        assert loaded.status.value == "transcribing"
