from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    UInt64,
    itxn,
)
from algopy.arc4 import abimethod, Address, UInt64 as ARC4UInt64, DynamicArray

class TeamVault(ARC4Contract):
    """
    Fair-Split Team Vault Contract
    """

    def __init__(self) -> None:
        # Map: Member Address -> Share (Basis Points)
        # Storing as UInt64 (AVM type) to be safe
        self.shares = BoxMap(Address, UInt64, key_prefix="s")
        self.total_shares = UInt64(0)
        self.admin = Global.creator_address

    @abimethod()
    def add_member(self, member: Address, share: ARC4UInt64) -> None:
        assert Txn.sender == self.admin, "Only admin can add members"
        
        _, exists = self.shares.maybe(member)
        assert not exists, "Member already exists, use update_share"
        
        new_share = share.native
        assert new_share > 0, "Share must be positive"
        assert self.total_shares + new_share <= 10000, "Total shares exceed 100%"
        
        self.shares[member] = new_share
        self.total_shares += new_share

    @abimethod()
    def update_share(self, member: Address, new_share: ARC4UInt64) -> None:
        assert Txn.sender == self.admin, "Only admin can update shares"
        
        current_share, exists = self.shares.maybe(member)
        assert exists, "Member does not exist"
        
        share_val = new_share.native
        
        new_total = self.total_shares - current_share + share_val
        assert new_total <= 10000, "Total shares exceed 100%"
        
        self.shares[member] = share_val
        self.total_shares = new_total

    # @abimethod()
    # def distribute(self, members: DynamicArray[Address]) -> None:
    #     assert Txn.sender == self.admin, "Only admin can distribute"
        
    #     balance = self.app.address.balance
    #     distributable = balance - 1_000_000
    #     assert distributable > 0, "No funds to distribute"
        
    #     for member in members:
    #         share, exists = self.shares.maybe(member)
    #         if exists:
    #             if share > 0:
    #                 amount = (distributable * share) // 10000
    #                 if amount > 0:
    #                     itxn.Payment(
    #                         receiver=member.native,
    #                         amount=amount,
    #                         fee=0
    #                     ).submit()
    
    @abimethod(readonly=True)
    def get_share(self, member: Address) -> ARC4UInt64:
        share, exists = self.shares.maybe(member)
        return ARC4UInt64(share) if exists else ARC4UInt64(0)
