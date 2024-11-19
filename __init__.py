from .prompt_converter import PromptConverter

NODE_CLASS_MAPPINGS = {
    "PromptConverter": PromptConverter,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptConverter": "Prompt Converter",
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']