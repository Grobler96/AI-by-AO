"""Generates the voiceover lines in vo/ with Kokoro (pip install kokoro-onnx soundfile). Usage: python make_voice.py [voice]"""
import numpy as np, soundfile as sf, sys
from kokoro_onnx import Kokoro
voice=sys.argv[1] if len(sys.argv)>1 else "bm_george"
k=Kokoro("kokoro-v1.0.int8.onnx","voices-v1.0.bin")  # model files: github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0)
voice_lang = "en-us" if voice.startswith("a") else "en-gb"
ph = lambda t: k.tokenizer.phonemize(t, voice_lang)
# The letter "A" is read as the word "a", so spell out "A M" and "A O" with explicit phonemes.
LETTER_A, LETTER_M, LETTER_O = "ˈeɪ", "ˈɛm", "ˈoʊ"
lines={"a":("Missed calls cost you jobs.",2.4,False),
"b":(ph("Your AI just booked a job at two")+f" {LETTER_A} {LETTER_M},",2.65,True),
"c":("while you were asleep.",1.6,False),
"d":("It answers, replies, sends invoices.",2.8,False),
"e":(ph("Meet...")+" "+ph("AI by")+f" {LETTER_A} {LETTER_O}.",1.9,True),
"f":("Book your free demo.",1.6,False)}
import os; os.makedirs("vo",exist_ok=True)
for key,(t,mx,isph) in lines.items():
    sp=1.08
    while True:
        s,sr=k.create(t,voice=voice,speed=sp,lang=voice_lang,is_phonemes=isph)
        idx=np.where(np.abs(s)>0.01)[0]; s=s[max(idx[0]-int(.02*sr),0):idx[-1]+int(.06*sr)]
        if len(s)/sr<=mx or sp>1.4: break
        sp+=0.04
    sf.write(f"vo/{key}.wav",s,sr); print(key,f"{len(s)/sr:.2f}s (max {mx}) speed {sp:.2f}",t)
