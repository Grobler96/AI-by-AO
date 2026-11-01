"""Generates the voiceover lines in vo/ with Kokoro (pip install kokoro-onnx soundfile). Usage: python make_voice.py [voice]"""
import numpy as np, soundfile as sf, sys
from kokoro_onnx import Kokoro
voice=sys.argv[1] if len(sys.argv)>1 else "bm_george"
k=Kokoro("kokoro-v1.0.int8.onnx","voices-v1.0.bin")  # model files: github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0)
lines={"a":("Missed calls cost you jobs.",2.4),
"b":("Your AI just booked a job at two A M,",2.65),
"c":("while you were asleep.",1.6),
"d":("It answers, replies, sends invoices.",2.8),
"e":("Meet... AI by A O.",1.9),
"f":("Book your free demo.",1.6)}
import os; os.makedirs("vo",exist_ok=True)
for key,(t,mx) in lines.items():
    sp=1.08
    while True:
        s,sr=k.create(t,voice=voice,speed=sp,lang="en-gb")
        idx=np.where(np.abs(s)>0.01)[0]; s=s[max(idx[0]-int(.02*sr),0):idx[-1]+int(.06*sr)]
        if len(s)/sr<=mx or sp>1.4: break
        sp+=0.04
    sf.write(f"vo/{key}.wav",s,sr); print(key,f"{len(s)/sr:.2f}s (max {mx}) speed {sp:.2f}",t)
