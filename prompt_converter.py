#!/bin/env python3

from pathlib import Path
import math
import json
import re

class PromptConverter:
    def __init__(self):
        try:
            dict_path = Path(__file__).parent / "tag_dict.json"
            if dict_path.exists():
                self.dict = json.loads(dict_path.read_text())
            else:
                self.dict = {}
        except Exception as e:
            print(f"タグ辞書の読み込みに失敗しました: {e}")
            self.dict = {}


        self.auto_quality_tags = json.loads((Path(__file__).parent / Path("auto_quality_tags.json")).read_text())
        
        self.score_tags_list = [
            "score_9",
            "score_8",
            "score_7",
            "score_6",
            "score_5",
            "score_4",
            "score_3",
            "score_2",
            "score_1",
            "score_8_up",
            "score_7_up",
            "score_6_up",
            "score_5_up",
            "score_4_up",
            "score_3_up",
            "score_2_up",
            "score_1_up",
            "high_score",
            "great_score",
            "good_score",
            "average_score",
            "bad_score",
            "low_score"
        ]
        self.quality_tags_list = [
            "masterpiece",
            "best_quality",
            "great_quality",
            "good_quality",
            "average_quality",
            "normal_quality",
            "bad_quality",
            "low_quality",
            "worst_quality",
            "very_aesthetic",
            "aesthetic",
            "displeasing",
            "very_displeasing",
            "absurdres",
            "source_anime"
        ]
        self.rating_tags_list = [
            "sfw",
            "nsfw",
            "explicit",
            "questionable",
            "safe",
            "sensitive",
            "general",
            "rating_safe",
            "rating_questionable",
            "rating_explicit"
        ]
        self.extra_tags_list = [
            r"^\d+girls?$",
            r"^\d+boys?$",
            "^1girl$",
            "^1boy$",
            "^male$",
            "^female$",
            "^solo$",
            "^multiple_girls$",
            "^multiple_boys$",
            "^female_child$",
            "^male_child$",
            "^mature_female$",
            "^mature_male$",
            "^old_female$",
            "^old_male$",
            "^(male|female)/(male/female)$",
        ]

        self.generation_tags_list = [
            "^newest$",
            "^late$",
            "^mid$",
            "^early$",
            "^oldest$",
        ]

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text" : ("STRING", {"multiline": True, "default": "", "forceInput": True}),
                "rating": (["safe", "sensitive", "questionable", "explicit"], {"default": "safe"}),
                "unique": ("BOOLEAN", {"default": True}),
                "auto_quality_tags": ("BOOLEAN", {"default": True}),
                "remove_weights": ("BOOLEAN", {"default": False})
            },
            "optional": {
            }
        }

    RETURN_TYPES = ("STRING", "STRING","STRING", "STRING", "STRING", )
    RETURN_NAMES = ("novelai3", "ponyxl", "animagine3.1", "animagine4.0", "illustrious")
    OUTPUT_NODE = True
    FUNCTION = "process_text"
    ALWAYS_EXECUTE = True

    def analyze_weight(self, tags):
        result = []
        for tag in tags:
            weight = 1.0
            processed = False
            
            # {tag}形式の解析を最初に行う
            if tag.startswith("{") and tag.endswith("}"):
                nest = tag.count("{")
                if nest == tag.count("}"):
                    tag = tag[nest:-nest]
                    weight = 1.05 ** nest
                    processed = True
                    
            # [tag]形式の解析
            elif tag.startswith("[") and tag.endswith("]"):
                nest = tag.count("[")
                if nest == tag.count("]"):
                    tag = tag[nest:-nest]
                    weight = 0.95 ** nest
                    processed = True
                    
            # (tag:1.1)形式の解析を最後に行う
            elif not processed and tag.startswith("(") and tag.endswith(")"):
                inner = tag[1:-1]
                if ":" in inner:
                    tag, w = inner.split(":")
                    try:
                        weight = float(w)
                    except ValueError:
                        pass
                        
            result.append({"name": tag, "weight": weight})
        return result

    def taglist_to_string(self, taglist, bracket):
        """
        tag_and_weight_listは(tag, weight)のタプルのリスト
        bracket"("の場合は(tag:weight)という文字列に変換
        bracket"{"の場合は、weightが1以上なら{tag}という文字列に変換、weightが1以下なら[tag]という文字列に変換
        どちらの場合もweightが1丁度の場合はtagのみを返す
        """
        result = []
        for x in taglist:
            tag = x["name"]
            weight = x["weight"]
            if abs(weight - 1.0) < 0.001:  # weightが1に近い場合
                result.append(tag)
            else:
                if bracket == "(":
                    result.append(f"({tag}:{weight})")
                else: 
                    if weight > 1:
                        # 1.05の何乗かを計算して{}の数を決定
                        nest = round(abs(math.log(weight, 1.05)))
                        result.append("{" * nest + tag + "}" * nest)
                    else:
                        # 0.95の何乗かを計算して[]の数を決定 
                        nest = round(abs(math.log(weight, 0.95)))
                        result.append("[" * nest + tag + "]" * nest)
        return ", ".join(result)
        

    def sort_tags(self, taglist, order, tag_format):
        result = []
        # まずdanbooruの処理を行う
        danbooru_dict = self.dict["danbooru"]
        for tag in taglist:
            processed_tag = {
                "name": tag["name"],
                "weight": tag["weight"],
                "type": 9,
                "count": 9
            }
            
            # danbooruのdictで検索
            if tag["name"] in danbooru_dict:
                processed_tag["name"] = danbooru_dict[tag["name"]]["name"]
                processed_tag["type"] = int(danbooru_dict[tag["name"]]["type"])
                processed_tag["count"] = int(danbooru_dict[tag["name"]]["count"])
            
            # e621の処理が必要な場合
            if tag_format == "e621" and tag["name"] in self.dict["e621"]:
                e621_data = self.dict["e621"][tag["name"]]
                processed_tag["name"] = e621_data["name"]
                processed_tag["type"] = int(e621_data["type"])
                processed_tag["count"] = int(e621_data["count"])
            
            # quality_tagsとrating_tagsの処理
            if processed_tag["name"] in self.score_tags_list:
                processed_tag["type"] = -2
            if processed_tag["name"] in self.quality_tags_list:
                processed_tag["type"] = -3
            elif processed_tag["name"] in self.rating_tags_list:
                processed_tag["type"] = -4
            
            # extra_tagsの正規表現チェック
            for pattern in self.extra_tags_list:
                if re.match(pattern, processed_tag["name"]):
                    processed_tag["type"] = -1
                    break
            result.append(processed_tag)

        # 0 一般
        # 1 画風
        # 3 ジャンル
        # 4 キャラクター
        # 5 その他
        # 9 不明
        # -1 人物・人数
        # -2 スコア
        # -3 クオリティ
        # -4 レーティング
        # -5 年代
        sort_priority = {
            "novelai3": [-1, 4, 3, 1, 5, 0, 9, -3, -2, -4, -5],
            "ponyxl": [-2, -3, -1, 4, 3, 1, 5, 0, 9, -4, -5],
            "animagine3.1": [-1, 4, 3, 5, 0, 9, 1, -3, -2, -4, -5],
            "animagine4.0": [-1, 4, 3, 5, 0, 9, 1, -3, -2, -4, -5],
            "illustrious": [-1, 4, 3, -4, 5, 0, 9, 1, -3, -2, -5]
        }[order]

        result2 = []
        # sort_priorityの順番でソート
        for p in sort_priority:
            l = list(filter(lambda x:x["type"] == p, result))
            result2.extend(l)
        return result2

    def process_text(self, text="", unique=True, auto_quality_tags=True, remove_weights=False, rating="safe"):
        # 空白を除去し、タグを分割
        tags = [x.strip().replace(" ", "_") for x in text.split(",") if x.strip()]
        # \でエスケープされているタグがあった場合はそれを取り除く
        tags = [x.replace("\\", "") for x in tags]

        # 重み解析を先に行う
        taglist_orig = self.analyze_weight(tags)

        if remove_weights:
            for tag in taglist_orig:
                tag["weight"] = 1.0

        prompts = []
        for order, tag_format in [("novelai3", "danbooru"), ("ponyxl", "e621"), ("animagine3.1", "danbooru"), ("animagine4.0", "danbooru"), ("illustrious", "danbooru")]:
            taglist = taglist_orig.copy()
            if auto_quality_tags is True:
                taglist.extend(self.auto_quality_tags[order])

            rating_taglist = {
                "novelai3": {
                    "safe": [],
                    "sensitive": [],
                    "questionable": [{"name": "nsfw", "weight": 1.0, "type": -4}],
                    "explicit": [{"name": "nsfw", "weight": 1.0, "type": -4}]
                },
                "ponyxl": {
                    "safe": [{"name": "rating_safe", "weight": 1.0, "type": -4}],
                    "sensitive": [{"name": "rating_questionable", "weight": 1.0, "type": -4}],
                    "questionable": [{"name": "rating_questionable", "weight": 1.0, "type": -4}],
                    "explicit": [{"name": "rating_explicit", "weight": 1.0, "type": -4}]
                },
                "animagine3.1": {
                    "safe": [{"name": "general", "weight": 1.0, "type": -4}],
                    "sensitive": [{"name": "sensitive", "weight": 1.0, "type": -4}],
                    "questionable": [{"name": "nsfw", "weight": 1.0, "type": -4}],
                    "explicit": [{"name": "nsfw", "weight": 1.0, "type": -4}, {"name": "explicit", "weight": 1.0, "type": -4}]
                },
                "animagine4.0": {
                    "safe": [{"name": "general", "weight": 1.0, "type": -4}],
                    "sensitive": [{"name": "sensitive", "weight": 1.0, "type": -4}],
                    "questionable": [{"name": "questionable", "weight": 1.0, "type": -4}],
                    "explicit": [{"name": "explicit", "weight": 1.0, "type": -4}]
                },
                "illustrious": {
                    "safe": [{"name": "general", "weight": 1.0, "type": -4}],
                    "sensitive": [{"name": "sensitive", "weight": 1.0, "type": -4}],
                    "questionable": [{"name": "questionable", "weight": 1.0, "type": -4}],
                    "explicit": [{"name": "explicit", "weight": 1.0, "type": -4}]
                }
            }[order][rating]

            taglist.extend(rating_taglist)

            taglist_uniq = []
            if unique is True:
                # uniq用の一覧、setを使うと順番が崩れるのでループで作成
                taglist_names = []
                for x in taglist:
                    if not x["name"] in taglist_names:
                        taglist_uniq.append(x)
                    taglist_names.append(x["name"])
                taglist = taglist_uniq.copy()

            taglist = self.sort_tags(taglist, order, tag_format)

            if order.strip() != "novelai3":
                for tag in taglist:
                    tag["name"] = tag["name"].replace("(", "\\(").replace(")", "\\)")

            for tag in taglist:
                tag["name"] = tag["name"].replace("_", " ")

            if order.strip() == "novelai3": 
                prompt = self.taglist_to_string(taglist, bracket="{")
            else:
                prompt = self.taglist_to_string(taglist, bracket="(")
            prompts.append(prompt)
        return tuple(prompts)

class PromptConverterWithFilter(PromptConverter):
    """
    タグタイプでフィルタリング機能を追加したPromptConverter
    """
    
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "text": ("STRING", {"multiline": True, "default": "", "forceInput": True}),
                "rating": (["safe", "sensitive", "questionable", "explicit"], {"default": "safe"}),
                "unique": ("BOOLEAN", {"default": True}),
                "auto_quality_tags": ("BOOLEAN", {"default": True}),
                "remove_weights": ("BOOLEAN", {"default": False}),
                "filter_general": ("BOOLEAN", {"default": False}),     # 一般タグを除外
                "filter_style": ("BOOLEAN", {"default": False}),       # 画風タグを除外
                "filter_genre": ("BOOLEAN", {"default": False}),       # ジャンルタグを除外
                "filter_character": ("BOOLEAN", {"default": False}),   # キャラクタータグを除外
                "filter_other": ("BOOLEAN", {"default": False}),       # その他タグを除外
                "filter_unknown": ("BOOLEAN", {"default": False}),     # 不明タグを除外
                "filter_person": ("BOOLEAN", {"default": False}),      # 人物・人数タグを除外
                "filter_score": ("BOOLEAN", {"default": False}),       # スコアタグを除外
                "filter_quality": ("BOOLEAN", {"default": False}),     # クオリティタグを除外
                "filter_rating": ("BOOLEAN", {"default": False}),      # レーティングタグを除外
                "filter_generation": ("BOOLEAN", {"default": False}),  # 年代タグを除外
            },
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING", "STRING", "STRING",)
    RETURN_NAMES = ("novelai3", "ponyxl", "animagine3.1", "animagine4.0", "illustrious", "filtered")
    OUTPUT_NODE = True
    FUNCTION = "process_text_with_filter"
    ALWAYS_EXECUTE = True

    def process_text_with_filter(self, text="", unique=True, auto_quality_tags=True, 
                               remove_weights=False, rating="safe", 
                               filter_general=False, filter_style=False,
                               filter_genre=False, filter_character=False,
                               filter_other=False, filter_unknown=False,
                               filter_person=False, filter_score=False,
                               filter_quality=False, filter_rating=False,
                               filter_generation=False):
        original_sort_tags = self.sort_tags
        filtered_tags_list = []  # フィルタリングされたタグを保存するリスト
        
        def filtered_sort_tags(taglist, order, tag_format):
            sorted_tags = original_sort_tags(taglist, order, tag_format)
            # フィルター条件を辞書で管理
            filters = {
                0: filter_general,     # 一般
                1: filter_style,       # 画風
                3: filter_genre,       # ジャンル
                4: filter_character,   # キャラクター
                5: filter_other,       # その他
                9: filter_unknown,     # 不明
                -1: filter_person,     # 人物・人数
                -2: filter_score,      # スコア
                -3: filter_quality,    # クオリティ
                -4: filter_rating,     # レーティング
                -5: filter_generation, # 年代
            }
            
            # フィルタリングされたタグを収集
            filtered_out = [
                tag["name"] for tag in sorted_tags 
                if filters.get(tag["type"], False)
            ]
            filtered_tags_list.extend(filtered_out)
            
            # フィルタリング条件に一致するタグを除外
            filtered_tags = [
                tag for tag in sorted_tags 
                if not filters.get(tag["type"], False)
            ]
            
            return filtered_tags
        
        self.sort_tags = filtered_sort_tags
        result = super().process_text(text, unique, auto_quality_tags, remove_weights, rating)
        self.sort_tags = original_sort_tags
        
        # フィルタリングされたタグを重複なしのカンマ区切りで返す
        filtered_result = ", ".join(sorted(set(filtered_tags_list)))
        
        return (*result, filtered_result)

if __name__ == "__main__":
    p = PromptConverter()
    print(p.process_text("game_cg"))
