from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field


HTTP_URL_PATTERN = r"^https?://[^\s]+$"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ORM(StrictModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid", str_strip_whitespace=True)


class DepartmentBase(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    code: str = Field(min_length=1, max_length=30)
    description: str | None = Field(default=None, max_length=5000)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    code: str | None = Field(default=None, min_length=1, max_length=30)


class DepartmentResponse(DepartmentBase, ORM):
    id: int
    created_at: datetime
    updated_at: datetime


class DirectoryBase(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    is_active: bool = True


class ExecutiveCreate(DirectoryBase):
    position: str = Field(min_length=1, max_length=150)
    academic_year: str = Field(min_length=1, max_length=20)
    department_id: int = Field(ge=1)
    student_id: str | None = Field(default=None, max_length=80)
    level: str | None = Field(default=None, max_length=50)
    program: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    photo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)
    bio: str | None = Field(default=None, max_length=5000)
    display_order: int = Field(default=0, ge=0, le=10000)


class ExecutiveUpdate(ExecutiveCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    position: str | None = Field(default=None, min_length=1, max_length=150)
    academic_year: str | None = Field(default=None, min_length=1, max_length=20)
    department_id: int | None = Field(default=None, ge=1)


class ClassRepresentativeCreate(DirectoryBase):
    level: str = Field(min_length=1, max_length=50)
    class_name: str = Field(min_length=1, max_length=150)
    program: str = Field(min_length=1, max_length=150)
    academic_year: str = Field(min_length=1, max_length=20)
    department_id: int = Field(ge=1)
    student_id: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    photo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)


class ClassRepresentativeUpdate(ClassRepresentativeCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    level: str | None = Field(default=None, min_length=1, max_length=50)
    class_name: str | None = Field(default=None, min_length=1, max_length=150)
    program: str | None = Field(default=None, min_length=1, max_length=150)
    academic_year: str | None = Field(default=None, min_length=1, max_length=20)
    department_id: int | None = Field(default=None, ge=1)


class LecturerCreate(DirectoryBase):
    department_id: int = Field(ge=1)
    title: str | None = Field(default=None, max_length=100)
    staff_id: str | None = Field(default=None, max_length=80)
    faculty: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    office: str | None = Field(default=None, max_length=150)
    specialization: str | None = Field(default=None, max_length=300)
    qualification: str | None = Field(default=None, max_length=300)
    bio: str | None = Field(default=None, max_length=5000)
    photo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)


class LecturerUpdate(LecturerCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    department_id: int | None = Field(default=None, ge=1)


class CourseCreate(StrictModel):
    course_code: str = Field(min_length=1, max_length=30)
    course_name: str = Field(min_length=1, max_length=200)
    department_id: int = Field(ge=1)
    description: str | None = Field(default=None, max_length=5000)
    credit_hours: int | None = Field(default=None, ge=0, le=30)
    level: str | None = Field(default=None, max_length=50)
    semester: str | None = Field(default=None, max_length=50)
    lecturer_id: int | None = Field(default=None, ge=1)
    is_active: bool = True


class CourseUpdate(CourseCreate):
    course_code: str | None = Field(default=None, min_length=1, max_length=30)
    course_name: str | None = Field(default=None, min_length=1, max_length=200)
    department_id: int | None = Field(default=None, ge=1)


class CourseRepresentativeCreate(DirectoryBase):
    course_id: int = Field(ge=1)
    academic_year: str = Field(min_length=1, max_length=20)
    department_id: int = Field(ge=1)
    student_id: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    level: str | None = Field(default=None, max_length=50)
    semester: str | None = Field(default=None, max_length=50)
    photo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)


class CourseRepresentativeUpdate(CourseRepresentativeCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    course_id: int | None = Field(default=None, ge=1)
    academic_year: str | None = Field(default=None, min_length=1, max_length=20)
    department_id: int | None = Field(default=None, ge=1)


class ConsultationCreate(StrictModel):
    day_of_week: str = Field(min_length=1, max_length=20)
    start_time: time
    end_time: time
    location: str | None = Field(default=None, max_length=200)
    mode: str | None = Field(default=None, max_length=50)
    instructions: str | None = Field(default=None, max_length=5000)
    is_active: bool = True


class ConsultationUpdate(ConsultationCreate):
    day_of_week: str | None = Field(default=None, min_length=1, max_length=20)
    start_time: time | None = None
    end_time: time | None = None


class ClubCreate(DirectoryBase):
    acronym: str | None = Field(default=None, max_length=30)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    president: str | None = Field(default=None, max_length=200)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=50)
    meeting_location: str | None = Field(default=None, max_length=200)
    meeting_day: str | None = Field(default=None, max_length=30)
    meeting_time: time | None = None
    logo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)
    social_links: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)
    department_id: int | None = Field(default=None, ge=1)


class ClubUpdate(ClubCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)


class CommitteeCreate(DirectoryBase):
    description: str | None = Field(default=None, max_length=5000)
    purpose: str | None = Field(default=None, max_length=5000)
    chairperson: str | None = Field(default=None, max_length=200)
    secretary: str | None = Field(default=None, max_length=200)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=50)
    department_id: int | None = Field(default=None, ge=1)
    academic_year: str | None = Field(default=None, max_length=20)


class CommitteeUpdate(CommitteeCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)


class CommitteeMemberCreate(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    role: str | None = Field(default=None, max_length=100)
    student_id: str | None = Field(default=None, max_length=80)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    photo_url: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)


class CommitteeMemberUpdate(CommitteeMemberCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)


class ContactCreate(DirectoryBase):
    role: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    office: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=500, pattern=HTTP_URL_PATTERN)
    category: str | None = Field(default=None, max_length=100)


class ContactUpdate(ContactCreate):
    name: str | None = Field(default=None, min_length=1, max_length=200)
