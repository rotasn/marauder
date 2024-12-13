from textblob import TextBlob
import sys

def contains_verbs(text):
    """Check if the given text contains any verbs but treat short texts (one or two words) like they are not verbs."""
    # Split the text into words
    words = text.split()

    # Special handling for one, two, or three-word texts
    if len(words) <= 3:
        # We will assume text contains no verbs unless we are certain it's an imperative (like "Go", "Run"). This avoids confusion for cases such as: "Drawing Room", "Waiting Area"
        imperative_verbs = {"go","enable","activate","say","run","talk","speak","type","select","examine", "look", "stop", "wait", "open","press","are","have","has","had"}
        if words[0].lower() in imperative_verbs:
            return True  # If the first word is an imperative we treat it as a verb

        return False  # Otherwise treat it as a noun or room name by default

    # For longer texts we use TextBlob for verb detection
    blob = TextBlob(text)

    # Analyze each token for verbs
    for word, tag in blob.tags:
        if tag.startswith('VB'):  # Check for verb POS tags
            return True
    return False

if __name__ == "__main__":
    input_text = " ".join(sys.argv[1:])

    # Check for verbs in the given input text
    if contains_verbs(input_text):
        print("True")  # Uh-oh verb found!
    else:
        print("False")  # No verb, probably is a room