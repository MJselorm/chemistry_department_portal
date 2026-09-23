from datetime import datetime, time
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Time, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class Timestamped(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(primary_key=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class Department(Timestamped):
    __tablename__="departments"
    name: Mapped[str]=mapped_column(String(200), unique=True); code: Mapped[str]=mapped_column(String(30), unique=True)
    description: Mapped[str|None]=mapped_column(Text); email: Mapped[str|None]=mapped_column(String(255)); phone: Mapped[str|None]=mapped_column(String(50)); location: Mapped[str|None]=mapped_column(String(255)); website: Mapped[str|None]=mapped_column(String(500))
    lecturers = relationship("Lecturer", lazy="selectin")
    courses = relationship("Course", lazy="selectin")
class Executive(Timestamped):
    __tablename__="executives"
    name: Mapped[str]=mapped_column(String(200)); position: Mapped[str]=mapped_column(String(150)); student_id: Mapped[str|None]=mapped_column(String(80)); level: Mapped[str|None]=mapped_column(String(50)); program: Mapped[str|None]=mapped_column(String(150)); phone: Mapped[str|None]=mapped_column(String(50)); email: Mapped[str|None]=mapped_column(String(255)); photo_url: Mapped[str|None]=mapped_column(String(500)); academic_year: Mapped[str]=mapped_column(String(20)); department_id: Mapped[int]=mapped_column(ForeignKey("departments.id", ondelete="RESTRICT")); bio: Mapped[str|None]=mapped_column(Text); display_order: Mapped[int]=mapped_column(Integer,default=0)
class ClassRepresentative(Timestamped):
    __tablename__="class_representatives"
    name: Mapped[str]=mapped_column(String(200)); student_id: Mapped[str|None]=mapped_column(String(80)); phone: Mapped[str|None]=mapped_column(String(50)); email: Mapped[str|None]=mapped_column(String(255)); level: Mapped[str]=mapped_column(String(50)); class_name: Mapped[str]=mapped_column(String(150)); program: Mapped[str]=mapped_column(String(150)); academic_year: Mapped[str]=mapped_column(String(20)); department_id: Mapped[int]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT")); photo_url: Mapped[str|None]=mapped_column(String(500))
class Lecturer(Timestamped):
    __tablename__="lecturers"
    name: Mapped[str]=mapped_column(String(200)); title: Mapped[str|None]=mapped_column(String(100)); staff_id: Mapped[str|None]=mapped_column(String(80),unique=True); department_id: Mapped[int]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT")); faculty: Mapped[str|None]=mapped_column(String(150)); email: Mapped[str|None]=mapped_column(String(255)); phone: Mapped[str|None]=mapped_column(String(50)); office: Mapped[str|None]=mapped_column(String(150)); specialization: Mapped[str|None]=mapped_column(String(300)); qualification: Mapped[str|None]=mapped_column(String(300)); bio: Mapped[str|None]=mapped_column(Text); photo_url: Mapped[str|None]=mapped_column(String(500))
    consultations = relationship("LecturerConsultation", lazy="selectin")
class Course(Timestamped):
    __tablename__="courses"; __table_args__=(UniqueConstraint("course_code","department_id",name="uq_course_department"),)
    course_code: Mapped[str]=mapped_column(String(30)); course_name: Mapped[str]=mapped_column(String(200)); description: Mapped[str|None]=mapped_column(Text); credit_hours: Mapped[int|None]=mapped_column(Integer); level: Mapped[str|None]=mapped_column(String(50)); semester: Mapped[str|None]=mapped_column(String(50)); department_id: Mapped[int]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT")); lecturer_id: Mapped[int|None]=mapped_column(ForeignKey("lecturers.id",ondelete="SET NULL"))
    representatives = relationship("CourseRepresentative", lazy="selectin")
class CourseRepresentative(Timestamped):
    __tablename__="course_representatives"; __table_args__=(UniqueConstraint("course_id","academic_year",name="uq_course_rep_year"),)
    name: Mapped[str]=mapped_column(String(200)); student_id: Mapped[str|None]=mapped_column(String(80)); phone: Mapped[str|None]=mapped_column(String(50)); email: Mapped[str|None]=mapped_column(String(255)); course_id: Mapped[int]=mapped_column(ForeignKey("courses.id",ondelete="RESTRICT")); level: Mapped[str|None]=mapped_column(String(50)); semester: Mapped[str|None]=mapped_column(String(50)); academic_year: Mapped[str]=mapped_column(String(20)); department_id: Mapped[int]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT")); photo_url: Mapped[str|None]=mapped_column(String(500))
class LecturerConsultation(Timestamped):
    __tablename__="lecturer_consultations"; lecturer_id: Mapped[int]=mapped_column(ForeignKey("lecturers.id",ondelete="RESTRICT")); day_of_week: Mapped[str]=mapped_column(String(20)); start_time: Mapped[time]=mapped_column(Time); end_time: Mapped[time]=mapped_column(Time); location: Mapped[str|None]=mapped_column(String(200)); mode: Mapped[str|None]=mapped_column(String(50)); instructions: Mapped[str|None]=mapped_column(Text)
class Club(Timestamped):
    __tablename__="clubs"; name: Mapped[str]=mapped_column(String(200),unique=True); acronym: Mapped[str|None]=mapped_column(String(30)); description: Mapped[str|None]=mapped_column(Text); category: Mapped[str|None]=mapped_column(String(100)); president: Mapped[str|None]=mapped_column(String(200)); contact_email: Mapped[str|None]=mapped_column(String(255)); contact_phone: Mapped[str|None]=mapped_column(String(50)); meeting_location: Mapped[str|None]=mapped_column(String(200)); meeting_day: Mapped[str|None]=mapped_column(String(30)); meeting_time: Mapped[time|None]=mapped_column(Time); logo_url: Mapped[str|None]=mapped_column(String(500)); social_links: Mapped[str|None]=mapped_column(Text); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT"))
class Committee(Timestamped):
    __tablename__="committees"; name: Mapped[str]=mapped_column(String(200)); description: Mapped[str|None]=mapped_column(Text); purpose: Mapped[str|None]=mapped_column(Text); chairperson: Mapped[str|None]=mapped_column(String(200)); secretary: Mapped[str|None]=mapped_column(String(200)); contact_email: Mapped[str|None]=mapped_column(String(255)); contact_phone: Mapped[str|None]=mapped_column(String(50)); department_id: Mapped[int|None]=mapped_column(ForeignKey("departments.id",ondelete="RESTRICT")); academic_year: Mapped[str|None]=mapped_column(String(20))
    members = relationship("CommitteeMember", lazy="selectin")
class CommitteeMember(Base):
    __tablename__="committee_members"; id: Mapped[int]=mapped_column(primary_key=True); committee_id: Mapped[int]=mapped_column(ForeignKey("committees.id",ondelete="RESTRICT")); name: Mapped[str]=mapped_column(String(200)); role: Mapped[str|None]=mapped_column(String(100)); student_id: Mapped[str|None]=mapped_column(String(80)); email: Mapped[str|None]=mapped_column(String(255)); phone: Mapped[str|None]=mapped_column(String(50)); photo_url: Mapped[str|None]=mapped_column(String(500)); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now()); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())
class DepartmentContact(Timestamped):
    __tablename__="department_contacts"; name: Mapped[str]=mapped_column(String(200)); role: Mapped[str|None]=mapped_column(String(150)); department: Mapped[str|None]=mapped_column(String(200)); description: Mapped[str|None]=mapped_column(Text); phone: Mapped[str|None]=mapped_column(String(50)); email: Mapped[str|None]=mapped_column(String(255)); office: Mapped[str|None]=mapped_column(String(150)); location: Mapped[str|None]=mapped_column(String(200)); website: Mapped[str|None]=mapped_column(String(500)); category: Mapped[str|None]=mapped_column(String(100))
