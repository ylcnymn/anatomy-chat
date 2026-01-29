import json
import os

def save_to_json(data, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    # Ensure data directory exists
    if not os.path.exists("data"):
        os.makedirs("data")

    # High-quality human anatomy JSON based on Uberon concepts
    mock_data = [
        {
            "id": "UBERON_0000955",
            "name": "Beyin",
            "latin_name": "Encephalon",
            "region": "Baş",
            "definition": "Merkezi sinir sisteminin ana organı. Düşünme, hafıza ve kontrol merkezi.",
            "importance": "Kritik",
            "icon": "Brain"
        },
        {
            "id": "UBERON_0000948",
            "name": "Kalp",
            "latin_name": "Cor",
            "region": "Gövde",
            "definition": "Kanı tüm vücuda pompalayan hayati kaslı organ.",
            "importance": "Kritik",
            "icon": "Heart"
        },
        {
            "id": "UBERON_0002107",
            "name": "Karaciğer",
            "latin_name": "Hepar",
            "region": "Gövde",
            "definition": "Vücudun en büyük iç organı. Toksinleri temizler ve metabolizmayı yönetir.",
            "importance": "Yüksek",
            "icon": "Activity"
        },
        {
            "id": "UBERON_0002048",
            "name": "Akciğer",
            "latin_name": "Pulmo",
            "region": "Gövde",
            "definition": "Solunum sisteminin ana organı. Oksijen alımı ve CO2 atılımını sağlar.",
            "importance": "Yüksek",
            "icon": "Activity"
        },
        {
            "id": "UBERON_0000945",
            "name": "Mide",
            "latin_name": "Ventriculus",
            "region": "Gövde",
            "definition": "Sindirim sisteminin ana organlarından biri. Besinleri parçalar.",
            "importance": "Orta",
            "icon": "Activity"
        },
        {
            "id": "UBERON_0002113",
            "name": "Böbrek",
            "latin_name": "Ren",
            "region": "Gövde",
            "definition": "Kanı süzerek atık maddeleri ve fazla suyu idrar olarak uzaklaştırır.",
            "importance": "Yüksek",
            "icon": "Activity"
        }
    ]
    save_to_json(mock_data, "data/anatomy_data.json")
