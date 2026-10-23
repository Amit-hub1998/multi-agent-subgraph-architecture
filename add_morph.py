"""add_morph.py — adds a Morph transition to every slide after the first.

Usage: python3 add_morph.py output/Multi-Agent-Systems.pptx

PowerPoint (Microsoft 365 / 2019+) plays Morph; older versions fall back to Fade.
Shapes are paired across slides by name ("!!name"), set in build_deck.js.
"""
import re
import shutil
import sys
import zipfile

MORPH = (
    '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
    '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
    '<p:transition spd="slow" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" p14:dur="900">'
    '<p159:morph option="byObject"/></p:transition></mc:Choice>'
    '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback>'
    '</mc:AlternateContent>'
)


def main(path):
    tmp = path + ".tmp"
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
            if m and int(m.group(1)) > 1:
                xml = data.decode("utf-8")
                if "p159:morph" not in xml:
                    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + MORPH, 1)
                data = xml.encode("utf-8")
            zout.writestr(item, data)
    shutil.move(tmp, path)
    print("Morph added:", path)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "output/Multi-Agent-Systems.pptx")
