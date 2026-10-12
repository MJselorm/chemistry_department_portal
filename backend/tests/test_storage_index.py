from app.services.storage_index import (
    academic_category_from_path,
    academic_course_code_from_path,
    academic_label,
    academic_metadata_from_path,
)


def test_chemistry_bucket_path_maps_to_level_and_semester():
    assert academic_metadata_from_path("chem_100/sem 1/Introduction.pdf") == ("100", "1")
    assert academic_metadata_from_path("chem_200/sem_2/Organic Chemistry.pdf") == ("200", "2")
    assert academic_metadata_from_path("chem 300/semester-1/Inorganic Chemistry.pdf") == ("300", "1")


def test_unstructured_path_does_not_invent_academic_metadata():
    assert academic_metadata_from_path("miscellaneous/notes.pdf") == (None, None)


def test_resource_label_is_derived_from_the_bucket_path_metadata():
    assert academic_label("100", "1") == "CHEM 100 · Semester 1"


def test_course_code_and_categories_are_inferred_from_course_paths_and_filenames():
    base = "CHEM_100/SEM 1/CHEM151/drive-file-id"
    assert academic_course_code_from_path(f"{base}/CHEM 151 LECTURE 7.pdf") == "CHEM 151"
    assert academic_category_from_path(f"{base}/CHEM 151 LECTURE 7.pdf") == "Lecture Notes"
    assert academic_category_from_path(f"{base}/INORGANIC QUESTIONS.pdf") == "Past Questions"
    assert academic_category_from_path(f"{base}/Atkins Textbook.pdf") == "Textbooks"


def test_unlabeled_files_remain_uncategorized_instead_of_being_guessed():
    assert academic_category_from_path("CHEM_100/SEM 1/CHEM151/handwritten.pdf") is None
