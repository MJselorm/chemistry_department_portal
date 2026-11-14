import pytest
from pydantic import ValidationError

from app.schemas import UpdateMyProfile


def test_profile_name_is_normalized():
    assert UpdateMyProfile(full_name="  Ama   Mensah ").full_name == "Ama Mensah"


def test_profile_name_rejects_whitespace_only_value():
    with pytest.raises(ValidationError):
        UpdateMyProfile(full_name="   ")
