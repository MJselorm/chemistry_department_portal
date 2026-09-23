from datetime import datetime, time
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class ORM(BaseModel): model_config=ConfigDict(from_attributes=True)
class DepartmentBase(BaseModel): name:str=Field(min_length=1,max_length=200); code:str=Field(min_length=1,max_length=30); description:str|None=None; email:EmailStr|None=None; phone:str|None=None; location:str|None=None; website:str|None=None; is_active:bool=True
class DepartmentCreate(DepartmentBase): pass
class DepartmentUpdate(DepartmentBase): name:str|None=None; code:str|None=None
class DepartmentResponse(DepartmentBase,ORM): id:int; created_at:datetime; updated_at:datetime

# Models intentionally share a small, strict CRUD schema vocabulary.
class DirectoryBase(BaseModel):
    name:str=Field(min_length=1,max_length=200); is_active:bool=True
class ExecutiveCreate(DirectoryBase): position:str; academic_year:str; department_id:int; student_id:str|None=None; level:str|None=None; program:str|None=None; phone:str|None=None; email:EmailStr|None=None; photo_url:str|None=None; bio:str|None=None; display_order:int=0
class ExecutiveUpdate(ExecutiveCreate): name:str|None=None; position:str|None=None; academic_year:str|None=None; department_id:int|None=None
class ClassRepresentativeCreate(DirectoryBase): level:str; class_name:str; program:str; academic_year:str; department_id:int; student_id:str|None=None; phone:str|None=None; email:EmailStr|None=None; photo_url:str|None=None
class ClassRepresentativeUpdate(ClassRepresentativeCreate): name:str|None=None; level:str|None=None; class_name:str|None=None; program:str|None=None; academic_year:str|None=None; department_id:int|None=None
class LecturerCreate(DirectoryBase): department_id:int; title:str|None=None; staff_id:str|None=None; faculty:str|None=None; email:EmailStr|None=None; phone:str|None=None; office:str|None=None; specialization:str|None=None; qualification:str|None=None; bio:str|None=None; photo_url:str|None=None
class LecturerUpdate(LecturerCreate): name:str|None=None; department_id:int|None=None
class CourseCreate(BaseModel): course_code:str; course_name:str; department_id:int; description:str|None=None; credit_hours:int|None=None; level:str|None=None; semester:str|None=None; lecturer_id:int|None=None; is_active:bool=True
class CourseUpdate(CourseCreate): course_code:str|None=None; course_name:str|None=None; department_id:int|None=None
class CourseRepresentativeCreate(DirectoryBase): course_id:int; academic_year:str; department_id:int; student_id:str|None=None; phone:str|None=None; email:EmailStr|None=None; level:str|None=None; semester:str|None=None; photo_url:str|None=None
class CourseRepresentativeUpdate(CourseRepresentativeCreate): name:str|None=None; course_id:int|None=None; academic_year:str|None=None; department_id:int|None=None
class ConsultationCreate(BaseModel): day_of_week:str; start_time:time; end_time:time; location:str|None=None; mode:str|None=None; instructions:str|None=None; is_active:bool=True
class ConsultationUpdate(ConsultationCreate): day_of_week:str|None=None; start_time:time|None=None; end_time:time|None=None
class ClubCreate(DirectoryBase): acronym:str|None=None; description:str|None=None; category:str|None=None; president:str|None=None; contact_email:EmailStr|None=None; contact_phone:str|None=None; meeting_location:str|None=None; meeting_day:str|None=None; meeting_time:time|None=None; logo_url:str|None=None; social_links:str|None=None; department_id:int|None=None
class ClubUpdate(ClubCreate): name:str|None=None
class CommitteeCreate(DirectoryBase): description:str|None=None; purpose:str|None=None; chairperson:str|None=None; secretary:str|None=None; contact_email:EmailStr|None=None; contact_phone:str|None=None; department_id:int|None=None; academic_year:str|None=None
class CommitteeUpdate(CommitteeCreate): name:str|None=None
class CommitteeMemberCreate(BaseModel): name:str; role:str|None=None; student_id:str|None=None; email:EmailStr|None=None; phone:str|None=None; photo_url:str|None=None
class CommitteeMemberUpdate(CommitteeMemberCreate): name:str|None=None
class ContactCreate(DirectoryBase): role:str|None=None; department:str|None=None; description:str|None=None; phone:str|None=None; email:EmailStr|None=None; office:str|None=None; location:str|None=None; website:str|None=None; category:str|None=None
class ContactUpdate(ContactCreate): name:str|None=None
