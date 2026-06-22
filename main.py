from fastapi import FastAPI
from pydantic import BaseModel
from proxy import transform_text

app = FastAPI()

class TextInput(BaseModel):
    text: str

@app.post("/transform")
def transform(input: TextInput):
    transformed = transform_text(input.text)
    return {"transformed": transformed}
