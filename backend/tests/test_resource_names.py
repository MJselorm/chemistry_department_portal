from app.services.resource_names import display_name


def test_timestamp_prefix_and_underscores_are_cleaned_for_display():
    assert display_name("1674057819920_ENGL_157_Ambiguity,_Dangling.pptx") == "ENGL 157 Ambiguity, Dangling.pptx"


def test_ordinary_filename_is_preserved():
    assert display_name("CHEM 354 - Lecture 6.pdf") == "CHEM 354 - Lecture 6.pdf"
