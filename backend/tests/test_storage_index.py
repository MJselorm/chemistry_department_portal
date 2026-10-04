from app.services.storage_index import academic_label, academic_metadata_from_path


def test_chemistry_bucket_path_maps_to_level_and_semester():
    assert academic_metadata_from_path("chem_100/sem 1/Introduction.pdf") == ("100", "1")
    assert academic_metadata_from_path("chem_200/sem_2/Organic Chemistry.pdf") == ("200", "2")
    assert academic_metadata_from_path("chem 300/semester-1/Inorganic Chemistry.pdf") == ("300", "1")


def test_unstructured_path_does_not_invent_academic_metadata():
    assert academic_metadata_from_path("miscellaneous/notes.pdf") == (None, None)


def test_resource_label_is_derived_from_the_bucket_path_metadata():
    assert academic_label("100", "1") == "CHEM 100 · Semester 1"
