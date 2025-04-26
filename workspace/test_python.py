#!/usr/bin/env python3
"""
Test file for VS Code Server with Roo extension
This file demonstrates Python support in the remote environment
"""

def greet(name):
    """
    Simple greeting function to test code intelligence
    
    Args:
        name (str): Name of the person to greet
        
    Returns:
        str: Greeting message
    """
    return f"Hello, {name}! Welcome to VS Code Server with Roo extension."

def calculate_sum(numbers):
    """
    Calculate the sum of a list of numbers
    
    Args:
        numbers (list): List of numbers to sum
        
    Returns:
        float: Sum of the numbers
    """
    return sum(numbers)

if __name__ == "__main__":
    # Test the greet function
    message = greet("Developer")
    print(message)
    
    # Test the calculate_sum function
    numbers = [1, 2, 3, 4, 5]
    result = calculate_sum(numbers)
    print(f"The sum of {numbers} is {result}")
    
    # This file can be used to test if Roo can analyze and provide suggestions
    # for Python code running in the remote VS Code instance.