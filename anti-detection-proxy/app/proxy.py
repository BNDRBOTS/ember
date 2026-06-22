import random
import re

def vary_perplexity(text: str) -> str:
    sentences = re.split(r'(?<=[.!?]) +', text)
    if len(sentences) > 1:
        random.shuffle(sentences)
    return " ".join(sentences)

def vary_burstiness(text: str) -> str:
    fillers = ["Honestly,", "Look,", "I mean,", "Well,", "So,"]
    if random.random() < 0.3:
        text = random.choice(fillers) + " " + text
    return text

def transform_text(text: str) -> str:
    text = vary_perplexity(text)
    text = vary_burstiness(text)
    return text
