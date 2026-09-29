from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..security import get_current_user, require_admin
from .. import directory_models as m
from .. import directory_schemas as s
from ..storage import upload_directory_image

router=APIRouter(
    prefix="/api/directory",
    tags=["directory"],
    dependencies=[Depends(get_current_user)],
)
DB=Annotated[Session,Depends(get_db)]; Admin=Annotated[User,Depends(require_admin)]; Current=Annotated[User,Depends(get_current_user)]
def one(session, model, ident):
    obj=session.get(model,ident)
    if not obj: raise HTTPException(404,"Directory record not found.")
    return obj
def save(session,obj):
    try: session.add(obj); session.commit(); session.refresh(obj); return obj
    except IntegrityError as e: session.rollback(); raise HTTPException(409,"A conflicting directory record already exists.") from e
def visible_one(session, model, ident, viewer):
    obj=one(session,model,ident)
    if viewer.role != "admin" and hasattr(obj,"is_active") and not obj.is_active:
        raise HTTPException(404,"Directory record not found.")
    return obj
def listing(model, session, skip, limit, filters, viewer=None):
    q=session.query(model)
    if viewer is not None and viewer.role != "admin" and hasattr(model,"is_active"):
        q=q.filter(model.is_active==True)
    for key,value in filters.items():
        if value is not None and hasattr(model,key): q=q.filter(getattr(model,key)==value)
    total=q.count(); return {"items":q.offset(skip).limit(limit).all(),"total":total,"skip":skip,"limit":limit}
def patch(session,obj,payload):
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(obj,k,v)
    return save(session,obj)
def remove(session,obj): obj.is_active=False; save(session,obj)

@router.post('/uploads/images', status_code=201)
async def upload_image(file: UploadFile = File(...), _: Admin = None):
    """Upload an image once, then use its returned URL in a directory create/update payload."""
    return {"url": await upload_directory_image(file)}

# FastAPI cannot synthesize **kwargs query parameters, so typed collection routes follow.
@router.get('/departments')
def departments(session:DB,viewer:Current,skip:int=Query(0,ge=0),limit:int=Query(50,ge=1,le=100),is_active:bool|None=None): return listing(m.Department,session,skip,limit,{"is_active":is_active},viewer)
@router.get('/departments/{record_id}')
def department(record_id:int,session:DB,viewer:Current): return visible_one(session,m.Department,record_id,viewer)
@router.post('/departments',status_code=201)
def create_department(payload:s.DepartmentCreate,session:DB,_:Admin): return save(session,m.Department(**payload.model_dump()))
@router.patch('/departments/{record_id}')
def update_department(record_id:int,payload:s.DepartmentUpdate,session:DB,_:Admin): return patch(session,one(session,m.Department,record_id),payload)
@router.delete('/departments/{record_id}',status_code=204)
def delete_department(record_id:int,session:DB,_:Admin): remove(session,one(session,m.Department,record_id))

def resource_routes(path,model,create,update, filter_fields):
    # Runtime registration with typed body dependencies; filtering remains generic via documented query-free paging.
    @router.get(path)
    def all_(request:Request,session:DB,viewer:Current,skip:int=Query(0,ge=0),limit:int=Query(50,ge=1,le=100),is_active:bool|None=None):
        filters={"is_active":is_active}
        for field in filter_fields:
            value=request.query_params.get(field)
            if value is not None: filters[field]=value
        return listing(model,session,skip,limit,filters,viewer)
    @router.get(path+'/{record_id}')
    def one_(record_id:int,session:DB,viewer:Current): return visible_one(session,model,record_id,viewer)
    @router.post(path,status_code=201)
    def create_(payload:create,session:DB,_:Admin): return save(session,model(**payload.model_dump()))
    @router.patch(path+'/{record_id}')
    def update_(record_id:int,payload:update,session:DB,_:Admin): return patch(session,one(session,model,record_id),payload)
    @router.delete(path+'/{record_id}',status_code=204)
    def delete_(record_id:int,session:DB,_:Admin): remove(session,one(session,model,record_id))
for args in [
    ('/executives',m.Executive,s.ExecutiveCreate,s.ExecutiveUpdate,('academic_year','department_id','position')),
    ('/class-representatives',m.ClassRepresentative,s.ClassRepresentativeCreate,s.ClassRepresentativeUpdate,('level','program','class_name','academic_year','department_id')),
    ('/lecturers',m.Lecturer,s.LecturerCreate,s.LecturerUpdate,('department_id','specialization','title')),
    ('/courses',m.Course,s.CourseCreate,s.CourseUpdate,('department_id','level','semester')),
    ('/course-representatives',m.CourseRepresentative,s.CourseRepresentativeCreate,s.CourseRepresentativeUpdate,('course_id','level','semester','academic_year','department_id')),
    ('/clubs',m.Club,s.ClubCreate,s.ClubUpdate,('department_id','category')),
    ('/committees',m.Committee,s.CommitteeCreate,s.CommitteeUpdate,('department_id','academic_year')),
    ('/contacts',m.DepartmentContact,s.ContactCreate,s.ContactUpdate,('category','department')),
]: resource_routes(*args)

@router.get('/lecturers/{lecturer_id}/consultations')
def consultations(lecturer_id:int,session:DB,viewer:Current,skip:int=Query(0,ge=0),limit:int=Query(50,ge=1,le=100)): visible_one(session,m.Lecturer,lecturer_id,viewer); return listing(m.LecturerConsultation,session,skip,limit,{"lecturer_id":lecturer_id},viewer)
@router.post('/lecturers/{lecturer_id}/consultations',status_code=201)
def add_consultation(lecturer_id:int,payload:s.ConsultationCreate,session:DB,_:Admin): one(session,m.Lecturer,lecturer_id); return save(session,m.LecturerConsultation(lecturer_id=lecturer_id,**payload.model_dump()))
@router.patch('/consultations/{record_id}')
def update_consultation(record_id:int,payload:s.ConsultationUpdate,session:DB,_:Admin): return patch(session,one(session,m.LecturerConsultation,record_id),payload)
@router.delete('/consultations/{record_id}',status_code=204)
def delete_consultation(record_id:int,session:DB,_:Admin): remove(session,one(session,m.LecturerConsultation,record_id))
@router.get('/committees/{committee_id}/members')
def members(committee_id:int,session:DB,viewer:Current): visible_one(session,m.Committee,committee_id,viewer); return session.query(m.CommitteeMember).filter_by(committee_id=committee_id).limit(100).all()
@router.post('/committees/{committee_id}/members',status_code=201)
def add_member(committee_id:int,payload:s.CommitteeMemberCreate,session:DB,_:Admin): one(session,m.Committee,committee_id); return save(session,m.CommitteeMember(committee_id=committee_id,**payload.model_dump()))
@router.patch('/committee-members/{record_id}')
def update_member(record_id:int,payload:s.CommitteeMemberUpdate,session:DB,_:Admin): return patch(session,one(session,m.CommitteeMember,record_id),payload)
@router.delete('/committee-members/{record_id}',status_code=204)
def delete_member(record_id:int,session:DB,_:Admin): session.delete(one(session,m.CommitteeMember,record_id)); session.commit()
@router.get('/summary')
def summary(session:DB): return {k:session.query(v).filter(getattr(v,'is_active',True)==True).count() for k,v in {'departments':m.Department,'executives':m.Executive,'class_representatives':m.ClassRepresentative,'course_representatives':m.CourseRepresentative,'lecturers':m.Lecturer,'courses':m.Course,'clubs':m.Club,'committees':m.Committee,'contacts':m.DepartmentContact}.items()}
@router.get('/search')
def search(q:str=Query(min_length=1,max_length=100),session:DB=None):
    def named(model,*fields): return session.query(model).filter(model.is_active==True,or_(*[getattr(model,f).ilike(f'%{q}%') for f in fields])).limit(20).all()
    return {'lecturers':named(m.Lecturer,'name'),'executives':named(m.Executive,'name','position'),'representatives':named(m.ClassRepresentative,'name','program')+named(m.CourseRepresentative,'name'),'courses':named(m.Course,'course_name','course_code'),'clubs':named(m.Club,'name'),'committees':named(m.Committee,'name'),'contacts':named(m.DepartmentContact,'name','role'),'departments':named(m.Department,'name','code')}
