from algopy import ARC4Contract, String
from algopy.arc4 import abimethod

class TutorEscrow(ARC4Contract):
    @abimethod()
    def hello(self) -> String:
        return String("Hello")
