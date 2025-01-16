from .prompt_converter import PromptConverter, PromptConverterWithFilter

NODE_CLASS_MAPPINGS = {
    "PromptConverter": PromptConverter,
    "PromptConverterWithFilter": PromptConverterWithFilter,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptConverter": "Prompt Converter",
    "PromptConverterWithFilter": "Prompt Converter (with Filter)",
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']